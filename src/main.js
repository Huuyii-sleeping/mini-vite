import { createApp } from 'vue'
import App from './App.vue'


// es6 会自动发送请求查找文件

// 默认会请求main.js 在后端会默认改写main.js当中的内容 实现模块查找
createApp(App).mount('#app')
