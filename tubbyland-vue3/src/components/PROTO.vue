<script>
import { h } from 'vue'
export default {
  render() {
    const slotNames = ['proto-header', 'proto-content', 'proto-footer']
    let newSlots = []
    for (const sname of slotNames) {
      if (!this.$slots[sname]) continue
      let currentSlot = (this.$slots[sname]()[0].props || { })
      currentSlot.class = currentSlot.class ? (currentSlot.class.includes(sname) ? currentSlot.class : `${currentSlot.class} ${sname}`) : sname

      this.$slots[sname]()[0].props = currentSlot
      newSlots.push(this.$slots[sname]())
    }

    //  [ this.$slots['proto-header'](), this.$slots['proto-content'](), this.$slots['proto-footer']() ]
    return h('div', { class: 'proto-container' }, newSlots)
  }
}
</script>