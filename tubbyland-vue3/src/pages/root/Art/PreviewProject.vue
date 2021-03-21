<script>
import { defineComponent, inject } from 'vue'
export default defineComponent({
  props: {
    preview: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    // Imports
    const assetBucket = inject('assetBucket')

    return {
      assetBucket,
      preview: props.preview
    }
  }
})
</script>

<template lang="pug">
div(class='project-preview hand-drawn-border')
  div(class='project-preview-info')
    div(class='project-preview-thumbnail hand-drawn-border')
      img(v-if='preview.sections?.images?.data?.[0]?.src' :src='preview.sections.images.data[0].src')
      img(v-else-if='preview.sections?.images?.data?.[0]?.name' src='/LoadingImage.svg')
      img(v-else src='/NoImages.png')
    ul(class='project-preview-details' v-if='preview.details')
      li Time: {{ preview.details.duration }}
      li Cost: {{ preview.details.cost ? `$${preview.details.cost}` : "FREE" }}
      li Difficulty: {{ preview.details.difficulty }}
  div(class='project-preview-title')
    h3 {{ preview.title }} 
</template>

<style lang="less" scoped>
@import '@/assets/css/global.less';

h3 {
  font-size: 1.4rem;
}
ul {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  margin: 10px;
  list-style-type: none;
}
// li
//   font-size 1.4rem
img {
  display: flex;
  align-self: flex-start;
  box-sizing: border-box;
  max-height: 100px;
  max-width: 200px;
}
.project-preview {
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  align-content: flex-start;
  justify-content: flex-start;
  margin: 5px;
  padding: 10px;
  &:hover {
    cursor: pointer;
  }
}
.project-preview-info {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.project-preview-thumbnail {
  overflow: hidden;
}
.project-preview-details {
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-content: flex-start;
  justify-content: flex-start;
}
.project-preview-title {
  display: flex;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
}
</style>