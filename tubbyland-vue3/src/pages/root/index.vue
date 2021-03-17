<script>
import { defineComponent, inject } from 'vue'
import { properties as PageSections } from '@/assets/data/sections.json'

export default defineComponent({
  setup() {
    const assetBucket = inject('assetBucket')
    return {
      assetBucket,
      Sections: PageSections.data
    }
  }
})
</script>

<template lang='pug'>
div(class='page')
  div(id='intro-container')
    div(id='intro-content')
      div(id='intro-text')
        div(id='intro-header')
          h1.centered Welcome To TubbyLand
          h2.centered You are home now
      div(id='intro-right')
        img(id='intro-image' class='hand-drawn-border' :src='`${assetBucket}/png/tubb.png`')
  div(id='info-container')
    div(v-for='(SectionValue, SectionName) in Sections' class='info-section')
      div(class='info-header')
        h2 {{ SectionValue.title }}
      div(class='info-cards-container')
        div(v-for='dataObject in SectionValue.data' class='info-card')
          img(class='svg' :src='`${assetBucket}/svg/IndexPage/${dataObject.icon}`' type="image/svg+xml")
          p {{ dataObject.text }}
</template>

<style scoped lang='less'>
@import '@/assets/css/global.less';

.welcome-half {
  height: 50%;
}

h1 {
  font-size: 3rem;
}
h2 {
  font-size: 2.3rem;
}
.page {
  flex-wrap: wrap;
}

#intro-container {
  display: flex;
  flex: 1 1;
  flex-wrap: wrap;

  justify-content: center;
  margin-bottom: 30px;
  padding-left: 30px;
  padding-right: 30px;
  min-height: auto;
  height: auto;
}
#intro-content {
  display: flex;
  flex: 1 0;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;

  #intro-text {
    display: flex;
    margin: 10px;
    flex: 1 1 1;
    flex-wrap: wrap;
    justify-content: center;
    h1 {
      font-size: 3rem;
    }
    h2 {
      font-size: 1.5rem;
    }
  }
  #intro-right {
    display: block;

    // Aspect Ratio: 0.75
    // Native Dimensions = 2560w x 1920h
    min-width: 256px;
    min-height: 192px;
    max-width: 60vh;
    max-height: 80vw;

    img {
      display: block;
      box-sizing: border-box;
      max-width: 100%;
      max-height: 100%;
    }
  }
}
#info-container {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  margin-top: 10px;
  margin-bottom: 60px;
  .info-section {
    display: flex;
    margin-top: 20px;
    margin-bottom: 20px;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    .info-header {
      display: flex;
      width: 100%;
      justify-content: center;
      text-align: center;
      align-items: center;
    }
    .info-cards-container {
      display: flex;
      width: 100%;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      .info-card {
        display: flex;
        flex-wrap: wrap;
        padding-left: 10px;
        padding-right: 10px;
        justify-content: center;
        align-items: center;
        min-width: 200px;
        max-width: 300px;
        p {
          display: flex;
          width: 100%;
          flex-wrap: wrap;
          text-align: center;
          font-weight: 0.1;
          font-size: 1.3rem;
        }
        img {
          display: flex;
          margin-left: auto;
          margin-right: auto;
          height: 80px;
          width: 80px;
          padding: 20px;
        }
      }
    }
  }
}
</style>