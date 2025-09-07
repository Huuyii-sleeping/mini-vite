<template>
  <div>{{ a }}</div>
  <button @click="addA">ADD</button>
  <h1>You did it</h1>
</template>

<script>
export default {
  data() {
    return {
      a: 1  // 在 Vue 2 中，data 返回的对象就是响应式的
    }
  },
  methods: {
    addA() {
      this.a++  // 使用 this.a 访问 data 中的变量
    }
  },
  created() {
    console.log(this.a)  // Vue 2 中访问 data 要加 this
  }
}
</script>

<style scoped></style>