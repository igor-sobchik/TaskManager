import os
from typing import List, Optional, Union
from fastapi import FastAPI, HTTPException, Depends, status, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, BeforeValidator
from typing_extensions import Annotated
from datetime import datetime

# MongoDB Driver & BSON types
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId

app = FastAPI()

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION (ENV VARS) ---
AUTH_PASSWORD = os.getenv("AUTH_PASSWORD", "admin")
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "AAAAABBBBBCCCCC") 
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "taskmanager")

# --- AUTHENTICATION SETUP ---
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != AUTH_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- MONGODB CONNECTION ---
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
collection = db["tasks"]

# --- TEMPLATES SETUP ---
# Takes the 'templates' folder relative to where main.py is running
templates = Jinja2Templates(directory="jinja2_templates")

# --- HELPER FUNCTIONS ---

def build_id_query(task_id: str) -> dict:
    """
    Constructs a MongoDB query that looks for the ID as an ObjectId.
    """
    try:
        return {"_id": ObjectId(task_id)}
    except InvalidId:
        raise HTTPException(status_code=404, detail="Invalid Task ID format")

def format_date_for_grouping(date_str):
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    
    day = date_obj.day
    if 4 <= day <= 20 or 24 <= day <= 30:
        suffix = "th"
    else:
        suffix = ["st", "nd", "rd"][day % 10 - 1]

    return f"{day}{suffix} of {date_obj.strftime('%B')} ({date_obj.strftime('%a')})"

# --- DATA MODELS ---

# Helper to map MongoDB's "_id" to "id"
PyObjectId = Annotated[str, BeforeValidator(str)]

class LoginRequest(BaseModel):
    password: str

class LoginResponse(BaseModel):
    token: str

class CustomField(BaseModel):
    key: str
    type: str
    value: Union[str, int, float, None] = None

class Task(BaseModel):
    # The name of field _id is ok
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    link: Optional[str] = None
    category: Optional[str] = None
    taskType: Optional[str] = None
    title: str
    dueDate: str
    dueTime: Optional[str] = None
    description: str = ""
    completed: bool = False
    cancelled: bool = False
    completeDate: Optional[str] = None
    customFields: List[CustomField] = []

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Buy groceries",
                "dueDate": "2023-10-25"
            }
        }

# --- API ENDPOINTS ---

@app.post("/api/login", response_model=LoginResponse)
def login(request: LoginRequest):
    if request.password == AUTH_PASSWORD:
        return {"token": AUTH_TOKEN}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Incorrect password"
    )

@app.get("/api/tasks", response_model=List[Task], response_model_by_alias=True, dependencies=[Depends(verify_token)])
async def get_tasks(types: Optional[str] = None):
    query = {}
    
    # Filter by task types if provided
    if types:
        allowed_types = types.split(',')
        # Logic: Matches allowed types OR taskType is null/missing
        query = {
            "$or": [
                {"taskType": {"$in": allowed_types}},
                {"taskType": {"$exists": False}},
                {"taskType": None}
            ]
        }
        
    tasks = await collection.find(query).to_list(1000)
    return tasks

@app.get("/api/tasks_markdown", response_class=Response, dependencies=[Depends(verify_token)])
async def get_tasks_markdown(types: Optional[str] = None):
    """
    Returns the list of tasks in Markdown format using a Jinja2 template.
    Accepts the same 'types' filter as the main tasks endpoint.
    """
    query = {}
    
    # Filter by task types if provided
    if types:
        allowed_types = types.split(',')
        query = {
            "$or": [
                {"taskType": {"$in": allowed_types}},
                {"taskType": {"$exists": False}},
                {"taskType": None}
            ]
        }
        
    # Fetch tasks from MongoDB (returns dicts)
    tasks = await collection.find(query).to_list(1000)

    # Group tasks by formatted due date
    grouped_tasks = {}
    for task in tasks:
        if task.get("dueDate"):
            formatted_date = format_date_for_grouping(task["dueDate"])
            if formatted_date not in grouped_tasks:
                grouped_tasks[formatted_date] = []
            grouped_tasks[formatted_date].append(task)
    
    # Load the template
    template = templates.get_template("tasks_md.j2")
    
    # Render the template with the tasks data
    # We pass 'tasks' to the template context
    content = template.render(grouped_tasks=grouped_tasks)
    
    # Return as Markdown text
    return Response(content=content, media_type="text/markdown")
    
@app.get("/api/tasks/{task_id}", response_model=Task, response_model_by_alias=True, dependencies=[Depends(verify_token)])
async def get_task(task_id: str):
    task = await collection.find_one(build_id_query(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/tasks", response_model=Task, response_model_by_alias=True, dependencies=[Depends(verify_token)])
async def create_task(task: Task):
    # Let MongoDB generate the _id (ObjectId)
    task_data = task.model_dump(by_alias=True, exclude={"id"})
    
    new_task = await collection.insert_one(task_data)
    created_task = await collection.find_one({"_id": new_task.inserted_id})
    return created_task

@app.put("/api/tasks/{task_id}", response_model=Task, response_model_by_alias=True, dependencies=[Depends(verify_token)])
async def update_task(task_id: str, task_update: Task):
    # Exclude _id from update payload to prevent immutable field error
    update_data = task_update.model_dump(by_alias=True, exclude={"id"})
    
    result = await collection.update_one(
        build_id_query(task_id), 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
        
    updated_task = await collection.find_one(build_id_query(task_id))
    return updated_task

@app.delete("/api/tasks/{task_id}", dependencies=[Depends(verify_token)])
async def delete_task(task_id: str):
    result = await collection.delete_one(build_id_query(task_id))
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return {"message": "Task deleted successfully"}