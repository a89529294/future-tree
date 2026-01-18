import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import {
  createBranch,
  readBranch,
  readBranches,
  updateBranch,
} from '@/data/branches'

export const branchQueryOptions = (branchId: string) => ({
  queryKey: ['branches', branchId],
  queryFn: () => readBranch({ data: branchId }),
})
export const branchesQueryOptions = () => ({
  queryKey: ['branches'],
  queryFn: () => readBranches(),
})

export const useBranch = (branchId: string) =>
  useSuspenseQuery(branchQueryOptions(branchId))

export const useBranches = () => useSuspenseQuery(branchesQueryOptions())

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
