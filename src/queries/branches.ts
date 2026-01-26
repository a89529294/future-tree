import {
  mutationOptions,
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  createBranch,
  readBranch,
  readBranches,
  updateBranch,
} from '@/data/branches'

export const branchesQueryKeys = {
  all: ['branches'] as const,
  branch: (branchNumber: string) =>
    [...branchesQueryKeys.all, branchNumber] as const,
}

export const branchQueryOptions = (branchNumber: string) =>
  queryOptions({
    queryKey: branchesQueryKeys.branch(branchNumber),
    queryFn: () => readBranch({ data: branchNumber }),
  })

export const branchesQueryOptions = () =>
  queryOptions({
    queryKey: branchesQueryKeys.all,
    queryFn: () => readBranches(),
  })

export const useBranch = (branchNumber: string) =>
  useSuspenseQuery(branchQueryOptions(branchNumber))

export const useBranches = () => useSuspenseQuery(branchesQueryOptions())

export const useUpdateBranch = () =>
  useMutation(
    mutationOptions({
      mutationFn: updateBranch,
    }),
  )

export const useCreateBranch = () =>
  useMutation(
    mutationOptions({
      mutationFn: createBranch,
    }),
  )
