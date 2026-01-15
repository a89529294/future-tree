import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { createStore, readStore, updateStore } from '@/data/stores'

export const storeQueryOptions = (storeId: string) => ({
  queryKey: ['stores', storeId],
  queryFn: () => readStore({ data: storeId }),
})

export const useStore = (storeId: string) =>
  useSuspenseQuery(storeQueryOptions(storeId))

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
