import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import {
  createStore,
  deleteStore,
  readStore,
  readStores,
  updateStore,
} from '@/data/stores'

export const storeQueryOptions = (storeNumber: string) => ({
  queryKey: ['stores', storeNumber],
  queryFn: () => readStore({ data: storeNumber }),
})

export const storesQueryOptions = () => ({
  queryKey: ['stores'],
  queryFn: () => readStores(),
})

export const useStore = (storeNumber: string) =>
  useSuspenseQuery(storeQueryOptions(storeNumber))

export const useStores = () => useSuspenseQuery(storesQueryOptions())

export const useUpdateStore = () =>
  useMutation({
    mutationKey: ['stores', 'update'],
    mutationFn: updateStore,
  })

export const useCreateStore = () =>
  useMutation({
    mutationKey: ['stores', 'create'],
    mutationFn: createStore,
  })

export const useDeleleStore = () =>
  useMutation({
    mutationKey: ['stores', 'delete'],
    mutationFn: deleteStore,
  })
