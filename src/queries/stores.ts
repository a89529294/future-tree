import {
  mutationOptions,
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  createStore,
  deleteStore,
  readStore,
  readStores,
  updateStore,
} from '@/data/stores'

export const storesQueryKeys = {
  all: ['stores'] as const,
  store: (storeNumber: string) =>
    [...storesQueryKeys.all, storeNumber] as const,
}

export const storeQueryOptions = (storeNumber: string) =>
  queryOptions({
    queryKey: storesQueryKeys.store(storeNumber),
    queryFn: () => readStore({ data: storeNumber }),
    enabled: !!storeNumber,
  })

export const storesQueryOptions = () =>
  queryOptions({
    queryKey: storesQueryKeys.all,
    queryFn: () => readStores(),
  })

export const useStore = (storeNumber: string) =>
  useSuspenseQuery(storeQueryOptions(storeNumber))

export const useStores = () => useSuspenseQuery(storesQueryOptions())

export const useUpdateStore = () =>
  useMutation(
    mutationOptions({
      mutationFn: updateStore,
    }),
  )

export const useCreateStore = () =>
  useMutation(
    mutationOptions({
      mutationFn: createStore,
    }),
  )

export const useDeleleStore = () =>
  useMutation(
    mutationOptions({
      mutationFn: deleteStore,
    }),
  )
