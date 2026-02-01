<template>
  <div class="min-h-full bg-white flex flex-col">
      <!-- Blue Header Section -->
      <div class="bg-blue-600 text-white p-4 shadow-md z-10 shrink-0">
          <div class="flex justify-between items-center">
              <button @click="$router.back()" class="text-blue-200 hover:text-white flex items-center transition-colors">
                  <i class="fa-solid fa-arrow-left mr-2"></i> Back
              </button>
              <h2 class="text-lg font-bold tracking-wide">{{ isNew ? 'New Task' : 'Edit Task' }}</h2>
              <button @click="saveTask" class="text-white font-bold hover:text-blue-200 transition-colors">Save</button>
          </div>
      </div>

      <div class="p-5 space-y-6 pb-20">
          <div class="space-y-4">
              <div v-if="showTaskTypeSelect">
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Task Type</label>
                  <select v-model="form.taskType" class="w-full border-gray-200 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option v-for="type in taskTypes" :key="type" :value="type">{{ type }}</option>
                  </select>
              </div>

              <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Task title *</label>
                  <input v-model="form.title" type="text" class="w-full text-lg font-semibold border-b border-gray-200 focus:border-blue-500 outline-none py-2" placeholder="What needs to be done?">
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2 grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Due Date *</label>
                          <input v-model="form.dueDate" type="date" class="w-full border-gray-200 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      </div>
                      <div>
                          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Due Time (Opt)</label>
                          <!-- step="60" ensures seconds are not requested, usually triggers clearer HH:MM selectors -->
                          <input v-model="form.dueTime" type="time" class="w-full border-gray-200 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      </div>
                  </div>
                  
                  <div class="col-span-2">
                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                      <div class="relative">
                          <input list="category-options" v-model="form.category" type="text" class="w-full border-gray-200 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="None">
                          <datalist id="category-options">
                              <option v-for="cat in allCategories" :key="cat" :value="cat"></option>
                          </datalist>
                          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                              <i class="fa-solid fa-caret-down text-xs"></i>
                          </div>
                      </div>
                  </div>
              </div>

              <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Link (Optional)</label>
                  <div class="relative">
                      <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <i class="fa-solid fa-link text-xs"></i>
                      </span>
                      <input v-model="form.link" type="text" class="w-full pl-8 border-gray-200 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://example.com">
                  </div>
              </div>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div class="flex justify-between items-center mb-3">
                  <label class="text-xs font-bold text-gray-500 uppercase">Custom Fields</label>
                  <button @click="addCustomField" class="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 transition">
                      <i class="fa-solid fa-plus mr-1"></i> Add
                  </button>
              </div>
              
              <div v-if="form.customFields.length === 0" class="text-center text-xs text-gray-400 py-2">
                  No custom fields.
              </div>

              <div v-for="(field, index) in form.customFields" :key="index" class="mb-3 p-3 bg-white rounded shadow-sm relative group">
                  <button @click="removeCustomField(index)" class="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                      <i class="fa-solid fa-times"></i>
                  </button>
                  <div class="grid grid-cols-2 gap-2 mb-2">
                      <input v-model="field.key" placeholder="Field Name" class="field-name-input text-xs font-bold border-b border-gray-200 focus:border-blue-500 outline-none w-full">
                      <select v-model="field.type" class="text-xs bg-transparent text-right outline-none text-gray-500">
                          <option value="string">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="link">Link</option>
                      </select>
                  </div>
                  <input v-if="field.type === 'string'" @paste="onCustomFieldPaste(field, $event)" v-model="field.value" type="text" placeholder="Value" class="w-full text-sm p-1 border rounded">
                  <input v-if="field.type === 'number'" v-model="field.value" type="number" placeholder="0" class="w-full text-sm p-1 border rounded">
                  <input v-if="field.type === 'date'" v-model="field.value" type="date" class="w-full text-sm p-1 border rounded">
                  <input v-if="field.type === 'link'" v-model="field.value" type="text" placeholder="https://example.com" class="w-full text-sm p-1 border rounded">
              </div>
          </div>

          <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Description (Markdown)</label>
              <div class="border border-gray-300 rounded overflow-hidden">
                  <MarkdownEditor v-model="form.description" />
              </div>
          </div>

          <div v-if="!isNew" class="pt-6 border-t mt-6">
              <button @click="handleDelete" class="w-full py-3 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50 transition flex justify-center items-center">
                  <i class="fa-solid fa-trash mr-2"></i> Delete Task
              </button>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TaskService, { type Task } from '../services/TaskService';
import MarkdownEditor from '../components/MarkdownEditor.vue';
import { config } from '../config';

const route = useRoute();
const router = useRouter();
// Use 'new' string check against the param '_id' (mapped in router)
const isNew = computed(() => route.params._id === 'new');
const allCategories = ref<string[]>([]);
const taskTypes = config.taskTypes;
const showTaskTypeSelect = taskTypes.length > 1;

const form = reactive<Task>({
    title: '',
    dueDate: '',
    dueTime: '',
    description: '',
    completed: false,
    cancelled: false,
    link: '', 
    category: '',
    taskType: config.defaultInputTaskType,
    customFields: []
});

onMounted(async () => {
    try {
        // 1. Handle New Task Defaults
        if (isNew.value) {
            form.dueDate = new Date().toLocaleDateString('en-CA');
        }

        // 2. Fetch ALL tasks to build the Category Autocomplete list
        const allTasks = await TaskService.getAll();
        const cats = new Set<string>();
        allTasks.forEach(t => {
            if (t.category && t.category.trim() !== '') {
                cats.add(t.category);
            }
        });
        allCategories.value = Array.from(cats).sort();

        // 3. Fetch the SPECIFIC task using getById
        if (!isNew.value) {
            // @ts-ignore
            const task = await TaskService.getById(route.params._id as string);
            
            if (task) {
                Object.assign(form, task);
                
                // Ensure defaults for optional fields
                if (!form.category) form.category = '';
                if (!form.dueTime) form.dueTime = '';
                if (!form.taskType) form.taskType = config.defaultInputTaskType;
            }
        }
    } catch (e) {
        console.error("Error loading task data", e);
    }
});

const addCustomField = async () => {
    form.customFields.push({ key: 'New Field', type: 'string', value: '' });
    await nextTick();
    const inputs = document.querySelectorAll('.field-name-input');
    const lastInput = inputs[inputs.length - 1] as HTMLElement;
    if (lastInput) {
        lastInput.focus();
        // @ts-ignore
        lastInput.select?.();
    }
};

const onCustomFieldPaste = async (field: any, event: ClipboardEvent) => {
    const pastedText = event.clipboardData?.getData('text');
    if (!pastedText) return;

    const urlPattern = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/[^\s]+$/; 
    
    if (pastedText.includes('://') && urlPattern.test(pastedText.trim())) {
        field.type = 'link';
        
        if (field.key === 'New Field') {
            const lower = pastedText.toLowerCase();
            if (lower.startsWith('obsidian://')) field.key = 'Obsidian';
            else if (lower.startsWith('zoom://') || lower.includes('zoom.us') || lower.includes('zoom.com')) field.key = 'Zoom';
            else if (lower.includes('atlasian.net') || lower.includes('atlassian.net')) field.key = 'Confluence';
            else if (lower.includes('tpondemand.com')) field.key = 'TP';
            else if (lower.includes('teams.microsoft.com')) field.key = 'Teams';
            else if (lower.includes('lucid.app')) field.key = 'LucidChart';
            else if (lower.includes('docs.google.com/spreadsheets')) field.key = 'Google.SpreadSheets';
            else if (lower.includes('docs.google.com/presentation')) field.key = 'Google.Slides';
            else if (lower.includes('docs.google.com')) field.key = 'Google.Docs';
            else if (lower.includes('sharepoint.com')) field.key = 'Word/Excel';
            else if (lower.includes('maps.app.goo.gl')) field.key = 'Google.Maps';
            else if (lower.includes('yandex.com/maps')) field.key = 'Yandex.Maps';
            else if (lower.includes('airbnb.com')) field.key = 'AirBnB';
        }

        field.value = pastedText.trim();
        event.preventDefault();
    }
};

const removeCustomField = (index: number) => {
    form.customFields.splice(index, 1);
};

const saveTask = async () => {
    if (!form.title || !form.dueDate) {
        alert("Title and Due Date are required.");
        return;
    }
    if (isNew.value) {
        await TaskService.create({ ...form });
    } else {
        // @ts-ignore
        await TaskService.update(route.params._id as string, { ...form });
    }
    router.back();
};

const handleDelete = async () => {
    if(confirm("Are you sure you want to permanently delete this task?")) {
        // @ts-ignore
        await TaskService.delete(route.params._id as string);
        router.back();
    }
};
</script>