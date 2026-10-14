<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { NeutralToneMapping } from 'three'
import ShowroomWorld from './ShowroomWorld.vue'

/** The one canvas of the shop: fixed over the page, click-through, painting into product views. */
const CANVAS_STYLE = { pointerEvents: 'none', touchAction: 'auto' } as const
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-30" aria-hidden="true">
    <TresCanvas
      alpha
      :clear-alpha="0"
      :dpr="[1, 1.75]"
      :tone-mapping="NeutralToneMapping"
      :tone-mapping-exposure="1.05"
      :style="CANVAS_STYLE"
    >
      <ShowroomWorld />
    </TresCanvas>
  </div>
</template>
