<template>
  <div 
    class="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-start gap-2 active:scale-[0.99] transition-transform duration-100 group" 
    :class="{'opacity-75 bg-gray-50': task.cancelled}"
  >
    <button @click="$emit('toggle', task)" class="mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0" :class="task.completed ? 'bg-green-500 border-green-500' : (task.cancelled ? 'border-gray-300 bg-gray-100' : 'border-gray-300 hover:border-blue-500')">
        <i v-if="task.completed" class="fa-solid fa-check text-white text-xs"></i>
        <i v-if="task.cancelled" class="fa-solid fa-minus text-gray-400 text-xs"></i>
    </button>

    <div class="flex-1 min-w-0 cursor-pointer" @click="handleMainClick">
        <h4 class="text-sm font-semibold truncate py-0.5" :class="(task.completed || task.cancelled) ? 'text-gray-400 line-through' : 'text-gray-800'">
            {{ displayTitle }}
            <i v-if="task.link" class="fa-solid fa-link text-blue-400 ml-1 text-xs" title="External Link"></i>
        </h4>
        
        <div class="flex flex-wrap gap-2 mt-1 py-1">
            <span v-if="task.taskType && task.taskType !== 'Task'" class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 font-semibold">
                {{ task.taskType }}
            </span>

            <span v-if="task.category" class="text-xs px-2 py-0.5 rounded border font-medium" :class="getCategoryStyle(task.category)">
                {{ task.category }}
            </span>

            <span v-if="task.completed && task.completeDate" class="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                <i class="fa-solid fa-check mr-1"></i>Done: {{ formattedCompleteDate }}
            </span>

            <span v-if="task.cancelled && task.completeDate" class="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 border border-gray-300">
                <i class="fa-solid fa-ban mr-1"></i>Cancelled: {{ formattedCompleteDate }}
            </span>

            <span 
                v-if="!task.completed && !task.cancelled"
                class="text-xs px-2 py-0.5 rounded border"
                :class="isOverdue ? 'bg-red-50 text-red-600 border-red-100 font-bold' : 'bg-gray-100 text-gray-600 border-gray-100'"
            >
                <i class="fa-regular fa-clock mr-1"></i>{{ formattedDateTime }}
            </span>

            <template v-for="field in task.customFields" :key="field.key">
                <a 
                    v-if="field.type === 'link'" 
                    :href="getSafeUrl(field.value)" 
                    target="_blank" 
                    @click.stop
                    class="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1 z-10 relative"
                    title="Open Link"
                >
                    {{ field.key }} <i class="fa-solid fa-up-right-from-square text-[10px]"></i>
                </a>
                
                <span 
                    v-else 
                    class="text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100"
                >
                    {{ field.key }}: {{ field.value }}
                </span>
            </template>
        </div>
    </div>

    <div class="flex flex-col gap-2 ml-2">
        <button @click.stop="goToEdit" class="text-gray-400 hover:text-blue-600">
            <i class="fa-solid fa-pen"></i>
        </button>
        <button @click.stop="$emit('cancel', task)" class="text-gray-400 hover:text-gray-600" :title="task.cancelled ? 'Reactivate' : 'Cancel Task'">
            <i class="fa-solid fa-ban" :class="{'text-gray-600': task.cancelled}"></i>
        </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Task } from '../services/TaskService';

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{
  (e: 'toggle', task: Task): void;
  (e: 'cancel', task: Task): void;
}>();

const router = useRouter();

// --- Helper Functions ---
const CATEGORY_COLORS: Record<string, string> = {
    'Grooming': 'bg-blue-100 text-blue-700 border-blue-200',
    'TaskManager': 'bg-green-100 text-green-700 border-green-200',
    'Personal': 'bg-green-100 text-green-700 border-green-200',
    '📖 Learning': 'bg-green-100 text-green-700 border-green-200',
    'Urgent': 'bg-red-100 text-red-700 border-red-200',
    '🌟 Small': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Current Sprint': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Scrum': 'bg-purple-100 text-purple-700 border-purple-200',
    'Services Sync-Up': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'UI Team Sync-Up': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Tony Sync-Up': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'UI AutoTests Sync-Up': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Alexey Kuznetsov': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Next Sprint Planning': 'bg-orange-100 text-orange-700 border-orange-200',
    'default': 'bg-gray-100 text-gray-600 border-gray-200'
};

const getCategoryStyle = (categoryName?: string) => {
    if (!categoryName) return '';
    const key = Object.keys(CATEGORY_COLORS).find(k => k.toLowerCase() === categoryName.toLowerCase());
    return key ? CATEGORY_COLORS[key] : CATEGORY_COLORS['default'];
};

const goToEdit = () => {
    const id = props.task._id;
    router.push(`/task/${id}`);
};

const handleMainClick = () => {
    if (props.task.link && props.task.link.trim() !== '') {
        let url = props.task.link.trim();
        window.open(url, '_blank');
    } else {
        goToEdit();
    }
};

const getSafeUrl = (url: string) => {
    if (!url) return '#';
    let safeUrl = url.trim();
    if (!/^https?:\/\//i.test(safeUrl) && !/^obsidian?:\/\//i.test(safeUrl)) {
        safeUrl = 'https://' + safeUrl;
    }
    return safeUrl;
};

// --- Computed Properties ---
const displayTitle = computed(() => {
    if (props.task.dueTime) {
        const [hours, minutes] = props.task.dueTime.split(':');
        const date = new Date();
        date.setHours(parseInt(hours || '0'), parseInt(minutes || '0'));
        // FIX: Enforce 24-hour format (en-GB, hour12: false)
        const timeString = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${timeString} ${props.task.title}`;
    }
    return props.task.title;
});

const formattedDateTime = computed(() => {
    if (!props.task.dueDate) return '';
    let str = new Date(props.task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    if (props.task.dueTime) {
        const [hours, minutes] = props.task.dueTime.split(':');
        const date = new Date();
        date.setHours(parseInt(hours || '0'), parseInt(minutes || '0'));
        // FIX: Enforce 24-hour format
        const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        str += `, ${timeStr}`;
    }
    return str;
});

const formattedCompleteDate = computed(() => {
    if (!props.task.completeDate) return '';
    return new Date(props.task.completeDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
});

const isOverdue = computed(() => {
    if (props.task.completed || props.task.cancelled) return false;
    const now = new Date();
    
    const todayStart = new Date(); 
    todayStart.setHours(0,0,0,0);
    
    const taskDate = new Date(props.task.dueDate);
    taskDate.setHours(0,0,0,0);

    if (taskDate < todayStart) return true;

    if (taskDate.getTime() === todayStart.getTime() && props.task.dueTime) {
        const [h, m] = props.task.dueTime.split(':');
        const taskFull = new Date();
        taskFull.setHours(parseInt(h || '0'), parseInt(m || '0'), 0, 0);
        if (taskFull < now) return true;
    }

    return false;
});
</script>