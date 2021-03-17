<script>
import { defineComponent, inject } from 'vue'
import { properties as HumanCredits } from '@/assets/data/human.credits.json'
import { properties as TechCredits } from '@/assets/data/tech.credits.json'

export default defineComponent({
  setup() {
    const bucket = inject('assetBucket')
    return {
      bucket,
      Credits: {
        human: HumanCredits,
        tech: TechCredits
      }
    }
  }
})
//#[a(:href='human.link') Link]
</script>

<template lang='pug'>
ul(id='credits')

  div(id='human-credits')
    li(class='human-category' v-for='(CategoryValue, CategoryName, CategoryIndex) in Credits.human' :key='CategoryIndex')
      h1 {{ CategoryName }}
      ul
        li(class='human-object hand-drawn-border' v-for='human in CategoryValue')
          div(class='left')
            img(:src='`${bucket}/png/${human.avatar}`')
            div {{ human.name }}
          div(class='right')
            div {{ human.bio.join(' ') }}
  div(id='tech-credits')
    li(class='tech-category' v-for='(CategoryValue, CategoryName, CategoryIndex) in Credits.tech' :key='CategoryIndex')
      h1 {{ CategoryName }}
      ul
        li(class='tech-object hand-drawn-border' v-for='tech in CategoryValue')
          div(class='tech-header')
            h3 {{ tech.name }} 
            a(target='_blank' :href='tech.link')
              i(class='material-icons-two-tone') open_in_new
          hr
          div {{ tech.purpose }}

</template>

<style scoped lang='less'>
@import '@/assets/css/global.less';

img {
  height: 50px;
  width: 50px;
}
li {
  list-style: none;
}
hr {
  margin: 0;
}
i {
  font-size: 0.8rem;
}
h1 {
  white-space: nowrap;
}

.tech-header {
  white-space: nowrap;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

#human-credits,
#tech-credits {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  align-items: center;
}
#tech-credits {
  flex-direction: row;
  flex-wrap: wrap;
}
.human-category,
.tech-category {
  display: flex;
  flex: 1;
  margin: 10px;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  align-items: center;
}
.human-object,
.tech-object {
  &:extend(.hand-drawn-border);
  display: flex;
  flex-wrap: wrap;
  margin: 4px;
  min-width: 7.2rem;
  padding: 5px;
}
.left {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-content: center;
  justify-content: center;
  align-items: center;
  margin: 7px;
}
.right {
  display: flex;
  flex: 9999;
  min-width: 12rem;
  max-width: 28rem;
  margin: 7px;
}

</style>