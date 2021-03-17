<script >
import { ref } from 'vue'
export default {
  props: {
    persistent: {
      type: Boolean,
      required: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const focused = ref(false)

    function flashFocus() {
      if (focused.value === true) return
      focused.value = true
      setTimeout(() => { focused.value = false }, 150)
    }

    function requestClose() {
      if (props.persistent) return flashFocus()
      else return emit("close")
    }

    return {
      focused,
      requestClose
    }
  }
}
</script>

<template lang="pug">
teleport(to="#oink-app")
  div(class='modal-mask' @click='requestClose')
    div(class='modal-plane')
      div(class='modal-content' :class='{ "modal-attention": focused }' @click.stop)
        div(class='modal-slot')
          slot
</template>

<style lang="less" scoped>
@import '@/assets/css/global.less';

.modal-mask {
  display: block;
  width: 100%;
  height: 100%;
  z-index: 9998;
  position: fixed;
  background-color: rgba(0, 0, 0, 0);
  background-color: rgba(0, 0, 0, 0.4);
  transition: opacity 0.3s ease;
}

.modal-plane {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  align-content: center;
}
.modal-content {
  &:extend(.hand-drawn-container);
  display: flex;
  max-width: 85%;
  max-height: 80%;
  margin: 20px;
  overflow: hidden;
  flex-direction: column;
  flex-basis: content;
  align-content: center;
  padding: 12px;
  border: 5px solid @var-graphite;
  background-color: lightgrey;
  /* border-top 5px solid red;
  border-right: 5px solid green;
  border-bottom: 5px solid blue;
  border-left: 5px solid yellow; */

  // border-top-left-radius: 5px 25px;
  // border-top-right-radius: 5px 25px;
  // border-bottom-left-radius: 15px 50px;
  // border-bottom-right-radius: 15px 50px;
  /* transition: border 2s ease; */
  //animation: borderIn 1s linear forwards;
}
.dark-theme {
  .modal-content {
    background-color: #9b9a96;
  }
}

.modal-slot {
  display: block;
  overflow-y: auto;
  box-sizing: border-box;
}

.modal-attention {
  animation: focus 0.15s linear;
}

@keyframes focus {
  0% {
    transform: scale(1);
  }
  
  50% {
    transform: scale(1.03);
  }
  
  100% {
    transform: scale(1);
  }
}

/*
on error, make border red
make border red of seciton that has error too
error section icon is exclamation mark
put an eclamation mark on each section
make error box apper with ame styling as sections
"There is at least one user error. Please correct it"
"There was an error processing your request."

on loading (submit), animate infinitely with green
*/
@keyframes borderIn {
  0% {
    border: 5px solid rgba(0,0,0, 0.2);
  }
  
  25% {
    border-top: 5px solid @var-graphite;
    border-right: 5px solid rgba(0,0,0, 0.2);
    border-bottom: 5px solid rgba(0,0,0, 0.2);
    border-left: 5px solid rgba(0,0,0, 0.2);
  }
  
  50% {
    border-top: 5px solid @var-graphite;
    border-right: 5px solid @var-graphite;
    border-bottom: 5px solid rgba(0,0,0, 0.2);
    border-left: 5px solid rgba(0,0,0, 0.2);
  }
  
  75% {
    border-top: 5px solid @var-graphite;
    border-right: 5px solid @var-graphite;
    border-bottom: 5px solid @var-graphite;
    border-left: 5px solid rgba(0,0,0, 0.2);
  }
  
  100% {
    border-top: 5px solid @var-graphite;
    border-right: 5px solid @var-graphite;
    border-bottom: 5px solid @var-graphite;
    border-left: 5px solid @var-graphite;
  }
}

@keyframes borderLoading {
  0% {
    border-color: rgba(0,0,0, 0.2);
    border-top-color: green;
  }
  
  33% {
    border-color: rgba(0,0,0, 0.2);
    border-right-color: green;
  }
  
  66% {
    border-color: rgba(0,0,0, 0.2);
    border-bottom-color: green;
  }
  
  100% {
    border-color: rgba(0,0,0, 0.2);
    border-left-color: green;
  }
}  

</style>