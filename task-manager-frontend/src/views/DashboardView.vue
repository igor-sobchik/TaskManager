<template>
  <div class="flex flex-col h-full">
      <!-- Blue Header Section -->
      <!-- Added relative and z-30 to ensure the dropdown (child of this header) sits on top of the scrolling content below -->
      <div class="bg-blue-600 text-white p-4 shadow-md z-30 relative shrink-0">
          <div class="flex justify-between items-start">
              <div>
                  <h2 class="text-xl font-bold tracking-wide">My Tasks</h2>
                  <p class="text-xs text-blue-200">{{ new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
              </div>
              
              <div class="flex items-center gap-3">
                  <!-- Custom Multi-Select Dropdown (Styled for Blue Header) -->
                  <div class="relative">
                      <button @click="isFilterOpen = !isFilterOpen" class="bg-blue-700 border border-blue-500 text-white py-1.5 pl-3 pr-8 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-300 shadow-sm flex items-center min-w-[130px] justify-between hover:bg-blue-600 transition-colors">
                          <span class="truncate max-w-[90px]">{{ filterLabel }}</span>
                          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-200">
                              <i class="fa-solid fa-filter text-[10px]"></i>
                          </div>
                      </button>

                      <!-- Dropdown Menu (White, Absolute) -->
                      <!-- Increased z-index to z-50 to ensure it floats above everything -->
                      <div v-if="isFilterOpen" class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden text-gray-800">
                          <div class="fixed inset-0 z-[-1]" @click="isFilterOpen = false"></div>
                          
                          <div class="p-2 space-y-1 max-h-60 overflow-y-auto">
                               <div class="text-[10px] uppercase font-bold text-gray-400 px-2 py-1">Filter Categories</div>
                               
                               <label v-for="cat in filterOptions" :key="cat" class="flex items-center px-2 py-2 hover:bg-gray-50 rounded cursor-pointer group">
                                  <div class="relative flex items-center">
                                      <input type="checkbox" :value="cat" v-model="filterCategories" class="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                  </div>
                                  <span class="ml-2 text-sm text-gray-700 group-hover:text-blue-600">{{ cat }}</span>
                               </label>

                               <div v-if="filterOptions.length === 0" class="text-xs text-gray-400 px-2 py-2 text-center">
                                   No categories found.
                               </div>
                          </div>
                          
                          <div class="bg-gray-50 p-2 flex justify-between items-center border-t border-gray-100">
                              <button @click="filterCategories = []" class="text-xs text-red-500 hover:text-red-700 font-medium px-2">Clear</button>
                              <button @click="isFilterOpen = false" class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Done</button>
                          </div>
                      </div>
                  </div>

                  <!-- Logout Button -->
                  <button @click="logout" class="text-blue-200 hover:text-white transition p-1">
                      <i class="fa-solid fa-sign-out-alt text-lg"></i>
                  </button>
              </div>
          </div>
      </div>

      <!-- Main Scrollable Content -->
      <!-- Reduced z-index to z-0 so it stays below the header dropdown -->
      <div class="flex-1 overflow-y-auto p-4 pb-24 space-y-6 z-0 relative">
          <div v-if="loading" class="flex justify-center py-10">
              <i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-2xl"></i>
          </div>

          <div v-else>
              <div v-if="tasks.length === 0" class="text-center py-20 text-gray-400">
                  <i class="fa-regular fa-clipboard text-6xl mb-4"></i>
                  <p>No tasks found. Add one!</p>
              </div>
              <div v-else-if="isEmptyAfterFilter" class="text-center py-20 text-gray-400">
                  <i class="fa-solid fa-filter-circle-xmark text-4xl mb-4"></i>
                  <p>No tasks match this filter.</p>
              </div>

              <section v-if="groupedTasks.overdue.length > 0" class="mb-6">
                  <h3 class="text-red-600 font-bold uppercase text-xs tracking-wider mb-3 px-1 flex items-center"><i class="fa-solid fa-circle-exclamation mr-2"></i> Overdue</h3>
                  <div class="space-y-3">
                      <task-card v-for="task in groupedTasks.overdue" :key="task._id" :task="task" @cancel="toggleCancel" @toggle="toggleComplete"></task-card>
                  </div>
              </section>

              <section v-if="groupedTasks.today.length > 0" class="mb-6">
                  <h3 class="text-blue-600 font-bold uppercase text-xs tracking-wider mb-3 px-1 flex items-center"><i class="fa-solid fa-calendar-day mr-2"></i> Today</h3>
                  <div class="space-y-3">
                      <task-card v-for="task in groupedTasks.today" :key="task._id" :task="task" @cancel="toggleCancel" @toggle="toggleComplete"></task-card>
                  </div>
              </section>

              <section v-for="(group, date) in groupedTasks.future" :key="date" class="mb-6">
                  <h3 class="text-gray-500 font-bold uppercase text-xs tracking-wider mb-3 px-1 sticky top-0 bg-gray-50 py-2 z-10 border-b">{{ formatDateHeader(date) }}</h3>
                  <div class="space-y-3">
                      <task-card v-for="task in group" :key="task._id" :task="task" @cancel="toggleCancel" @toggle="toggleComplete"></task-card>
                  </div>
              </section>
              
              <section v-if="groupedTasks.completed.length > 0" class="mt-8 pt-4 border-t border-gray-200">
                  <button @click="showCompleted = !showCompleted" class="w-full flex items-center justify-between text-gray-400 hover:text-gray-600 mb-3 group">
                      <h3 class="font-bold uppercase text-xs tracking-wider px-1 flex items-center"><i class="fa-solid fa-check-circle mr-2"></i> Completed ({{ groupedTasks.completed.length }})</h3>
                      <i class="fa-solid transition-transform duration-200" :class="showCompleted ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                  </button>
                  <div v-if="showCompleted" class="space-y-3 opacity-60">
                      <task-card v-for="task in groupedTasks.completed" :key="task._id" :task="task" @cancel="toggleCancel" @toggle="toggleComplete"></task-card>
                  </div>
              </section>

              <section v-if="groupedTasks.cancelled.length > 0" class="mt-6 pt-4 border-t border-gray-200">
                  <button @click="showCancelled = !showCancelled" class="w-full flex items-center justify-between text-gray-400 hover:text-gray-600 mb-3 group">
                      <h3 class="font-bold uppercase text-xs tracking-wider px-1 flex items-center"><i class="fa-solid fa-ban mr-2"></i> Cancelled ({{ groupedTasks.cancelled.length }})</h3>
                      <i class="fa-solid transition-transform duration-200" :class="showCancelled ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                  </button>
                  <div v-if="showCancelled" class="space-y-3 opacity-60">
                      <task-card v-for="task in groupedTasks.cancelled" :key="task._id" :task="task" @cancel="toggleCancel" @toggle="toggleComplete"></task-card>
                  </div>
              </section>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import TaskService, { type Task } from '../services/TaskService';
import TaskCard from '../components/TaskCard.vue';

const router = useRouter();
const tasks = ref<Task[]>([]);
const categories = ref<string[]>([]);
const loading = ref(true);

// Filter State
const savedFilters = localStorage.getItem('dashboard_filter_categories');
const filterCategories = ref<string[]>(savedFilters ? JSON.parse(savedFilters) : []);
const isFilterOpen = ref(false);

const showCompleted = ref(false);
const showCancelled = ref(false);

watch(filterCategories, (newVal) => {
    localStorage.setItem('dashboard_filter_categories', JSON.stringify(newVal));
}, { deep: true });

const logout = () => {
    localStorage.removeItem('authToken');
    window.dispatchEvent(new Event('auth-changed'));
    router.push('/login');
};

const loadData = async () => {
    loading.value = true;
    try {
        const fetchedTasks = await TaskService.getAll();
        tasks.value = fetchedTasks;
        
        const cats = new Set<string>();
        fetchedTasks.forEach(t => {
            if (t.category && t.category.trim() !== '') {
                cats.add(t.category);
            }
        });
        categories.value = Array.from(cats).sort();
    } catch (e) {
        console.error("Failed to load data", e);
    } finally {
        loading.value = false;
    }
};

onMounted(loadData);

const toggleComplete = async (task: Task) => {
    task.completed = !task.completed;
    if (task.completed) {
        task.completeDate = new Date().toISOString();
        task.cancelled = false;
    } else {
        task.completeDate = null;
    }
    // @ts-ignore
    await TaskService.update(task._id, task);
};

const toggleCancel = async (task: Task) => {
    if (task.cancelled) {
        task.cancelled = false;
        task.completeDate = null;
    } else {
        task.cancelled = true;
        task.completed = false;
        task.completeDate = new Date().toISOString();
    }
    // @ts-ignore
    await TaskService.update(task._id, task);
};

const filterOptions = computed(() => {
    return [...categories.value, '(None)'];
});

const filterLabel = computed(() => {
    if (filterCategories.value.length === 0) return 'All Categories';
    if (filterCategories.value.length === 1) return filterCategories.value[0];
    return `${filterCategories.value.length} Selected`;
});

const groupedTasks = computed(() => {
    let filtered = tasks.value;
    
    if (filterCategories.value.length > 0) {
        filtered = filtered.filter(t => {
            if (!t.category || t.category.trim() === '') {
                return filterCategories.value.includes('(None)');
            }
            return filterCategories.value.includes(t.category);
        });
    }

    // const now = new Date();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    
    const groups = {
        overdue: [] as Task[],
        today: [] as Task[],
        future: {} as Record<string, Task[]>,
        completed: [] as Task[],
        cancelled: [] as Task[]
    };

    const sorted = [...filtered].sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        if (a.dueTime && !b.dueTime) return -1;
        if (!a.dueTime && b.dueTime) return 1;
        if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
        return 0;
    });

    sorted.forEach(t => {
        if (t.cancelled) {
            groups.cancelled.push(t);
            return;
        }
        if (t.completed) {
            groups.completed.push(t);
            return;
        }

        const taskDate = new Date(t.dueDate);
        taskDate.setHours(0,0,0,0);

        let isStrictlyOverdue = false;
        if (taskDate < todayStart) {
            isStrictlyOverdue = true;
        } // else if (taskDate.getTime() === todayStart.getTime()) {
        //     if (t.dueTime) {
        //         const [h, m] = t.dueTime.split(':');
        //         const taskFull = new Date();
        //         taskFull.setHours(parseInt(h || '0'), parseInt(m || '0'), 0, 0);
        //         if (taskFull < now) isStrictlyOverdue = true;
        //     }
        // }
        
        if (isStrictlyOverdue) {
            groups.overdue.push(t);
        } else if (taskDate.getTime() === todayStart.getTime()) {
            groups.today.push(t);
        } else {
            const key = t.dueDate;
            if (!groups.future[key]) groups.future[key] = [];
            groups.future[key].push(t);
        }
    });

    const sortByDateDesc = (a: Task, b: Task) => {
         const da = a.completeDate ? new Date(a.completeDate).getTime() : 0;
         const db = b.completeDate ? new Date(b.completeDate).getTime() : 0;
         return db - da;
    };
    groups.completed.sort(sortByDateDesc);
    groups.cancelled.sort(sortByDateDesc);

    return groups;
});

const isEmptyAfterFilter = computed(() => {
    const g = groupedTasks.value;
    return tasks.value.length > 0 && 
           g.overdue.length === 0 && 
           g.today.length === 0 && 
           Object.keys(g.future).length === 0 && 
           g.completed.length === 0 &&
           g.cancelled.length === 0;
});

const formatDateHeader = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-GB', options);
};
</script>