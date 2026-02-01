<template>
  <div class="codemirror-wrapper bg-white border border-gray-200 rounded-lg overflow-hidden">
    <textarea ref="textarea"></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown.js';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
const textarea = ref<HTMLTextAreaElement | null>(null);
let cmInstance: CodeMirror.EditorFromTextArea | null = null;

onMounted(() => {
  if (textarea.value) {
    cmInstance = CodeMirror.fromTextArea(textarea.value, {
      mode: 'markdown',
      theme: 'default',
      lineNumbers: false,
      lineWrapping: true,
      viewportMargin: Infinity
    });

    cmInstance.setValue(props.modelValue || '');

    cmInstance.on('change', () => {
      const val = cmInstance?.getValue();
      if (val !== props.modelValue) {
        emit('update:modelValue', val);
      }
    });
  }
});

watch(() => props.modelValue, (newVal) => {
  if (cmInstance && newVal !== cmInstance.getValue()) {
    const info = cmInstance.getScrollInfo();
    cmInstance.setValue(newVal || '');
    cmInstance.scrollTo(info.left, info.top);
  }
});
</script>

<style>
/* CSS from your index.html head */
.codemirror-wrapper { max-height: 500px; overflow-y: auto; }
.CodeMirror { height: auto !important; min-height: 150px; font-family: monospace; padding: 8px 4px; }
.CodeMirror-vscrollbar, .CodeMirror-hscrollbar { display: none !important; }
</style>