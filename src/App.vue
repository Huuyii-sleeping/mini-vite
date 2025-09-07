<template>
  <div>{{ a }}</div>
  <button @click="addA">ADD</button>
  <h1>You did it!</h1>
</template>

<script setup>
import { ref } from 'vue' 
const a = ref(1)
const addA = () => {
  a.value ++
}
console.log(a.value)
</script>



<style scoped></style>
