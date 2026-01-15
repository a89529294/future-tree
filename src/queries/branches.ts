import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { createBranch, readBranch, updateBranch } from '@/data/branches'

export const branchQueryOptions = (branchId: string) => ({
  queryKey: ['branches', branchId],
  queryFn: () => readBranch({ data: branchId }),
})

export const useBranch = (branchId: string) =>
  useSuspenseQuery(branchQueryOptions(branchId))

export const useUpdateBranch = () =>
  useMutation({
    mutationKey: ['branches', 'update'],
    mutationFn: updateBranch,
  })

export const useCreateBranch = () =>
  useMutation({
    mutationKey: ['branches', 'create'],
    mutationFn: createBranch,
  })
