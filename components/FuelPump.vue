<template>
  <div class="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">Bomba {{ pumpNumber }}</h3>
      <span :class="statusClass" class="px-3 py-1 rounded-full text-sm font-medium">
        {{ status }}
      </span>
    </div>
    
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Combustível</label>
          <select v-model="selectedFuel" class="w-full p-2 border border-gray-300 rounded-md">
            <option value="gasolina">Gasolina Comum</option>
            <option value="aditivada">Gasolina Aditivada</option>
            <option value="etanol">Etanol</option>
            <option value="diesel">Diesel</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Preço/L</label>
          <input 
            v-model="fuelPrice" 
            type="text" 
            readonly 
            class="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
          >
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Litros</label>
          <input 
            v-model="liters" 
            type="number" 
            step="0.01" 
            class="w-full p-2 border border-gray-300 rounded-md"
            @input="calculateTotal"
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Total</label>
          <input 
            v-model="total" 
            type="text" 
            readonly 
            class="w-full p-2 border border-gray-300 rounded-md bg-gray-50 font-semibold"
          >
        </div>
      </div>
      
      <div class="flex gap-2">
        <button 
          @click="startFueling" 
          :disabled="!canStart"
          class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Iniciar Abastecimento
        </button>
        
        <button 
          @click="finalizeSale" 
          :disabled="!canFinalize"
          class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Finalizar Venda
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  pumpNumber: {
    type: Number,
    required: true
  }
})

const selectedFuel = ref('gasolina')
const liters = ref(0)
const total = ref('R$ 0,00')
const status = ref('Disponível')

const fuelPrices = {
  gasolina: 5.89,
  aditivada: 6.15,
  etanol: 4.29,
  diesel: 5.45
}

const fuelPrice = computed(() => {
  return `R$ ${fuelPrices[selectedFuel.value].toFixed(2).replace('.', ',')}`
})

const statusClass = computed(() => {
  switch (status.value) {
    case 'Disponível':
      return 'bg-green-100 text-green-800'
    case 'Em Uso':
      return 'bg-yellow-100 text-yellow-800'
    case 'Manutenção':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

const canStart = computed(() => {
  return status.value === 'Disponível' && liters.value > 0
})

const canFinalize = computed(() => {
  return status.value === 'Em Uso' && liters.value > 0
})

const calculateTotal = () => {
  const totalValue = liters.value * fuelPrices[selectedFuel.value]
  total.value = `R$ ${totalValue.toFixed(2).replace('.', ',')}`
}

const startFueling = () => {
  status.value = 'Em Uso'
  console.log(`Iniciando abastecimento na bomba ${props.pumpNumber}`)
}

const finalizeSale = () => {
  status.value = 'Disponível'
  console.log(`Venda finalizada: ${liters.value}L de ${selectedFuel.value} = ${total.value}`)
  // Reset values
  liters.value = 0
  total.value = 'R$ 0,00'
}

watch(selectedFuel, () => {
  calculateTotal()
})
</script>
