'use client'

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { searchItems } from "@/app/actions/search"
import { Building2, Loader2, LucideLandmark, Search, Users } from "lucide-react"

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [results, setResults] = useState<{
        properties: any[]
        spaces: any[]
        tenants: any[]
    }>({ properties: [], spaces: [], tenants: [] })
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const handleSearch = useCallback(async (value: string) => {
        setLoading(true)

        try {
            if (!value || value.length < 2) {
                setResults({ properties: [], spaces: [], tenants: [] })
                setLoading(false)
                return
            }

            const data = await searchItems(value)
            setResults(data)
        } catch (error) {
            console.error("Search failed:", error)
            setResults({ properties: [], spaces: [], tenants: [] })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, handleSearch])

    const onSelect = (href: string) => {
        setOpen(false)
        router.push(href)
    }

    const handleOpenChange = (open: boolean) => {
        setOpen(open)
        if (!open) {
            setSearchQuery("")
            setResults({ properties: [], spaces: [], tenants: [] })
            setLoading(false)
        }
    }

    const handleItemClick = (href: string) => {
        onSelect(href)
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-3 px-4 h-10 text-sm text-gray-600 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 shadow-sm hover:shadow-md"
            >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline-flex">Search anything...</span>
                <div className="hidden sm:flex items-center gap-1 ml-auto">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 dark:bg-gray-700 px-1.5 font-mono text-[10px] font-medium text-gray-600 dark:text-gray-300">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </button>

            <CommandDialog open={open} onOpenChange={handleOpenChange}>
                <CommandInput
                    placeholder="Search properties, spaces, tenants..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="text-base"
                />
                <CommandList className="max-h-[500px] overflow-y-auto">
                    {loading ? (
                        <CommandEmpty>
                            <div className="flex items-center justify-center gap-2 py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Searching...</span>
                            </div>
                        </CommandEmpty>
                    ) : !searchQuery || searchQuery.length < 2 ? (
                        <CommandEmpty>
                            <div className="flex flex-col items-center justify-center gap-3 py-8">
                                <Search className="h-12 w-12 text-gray-400" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Start typing to search
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Enter at least 2 characters to see results
                                    </p>
                                </div>
                            </div>
                        </CommandEmpty>
                    ) : results.properties.length === 0 &&
                        results.spaces.length === 0 &&
                        results.tenants.length === 0 ? (
                        <CommandEmpty>
                            <div className="flex flex-col items-center justify-center gap-3 py-8">
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        No results found
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        No matches for {searchQuery}
                                    </p>
                                </div>
                            </div>
                        </CommandEmpty>
                    ) : (
                        <>
                            {results.properties.length > 0 && (
                                <CommandGroup heading="Properties" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 px-3 py-2">
                                    {results.properties.map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={item.title}
                                            onSelect={() => onSelect(item.href)}
                                            onClick={() => handleItemClick(item.href)}
                                            className="cursor-pointer p-0 hover:bg-gray-100 dark:hover:bg-gray-800 data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800 rounded-lg transition-all duration-200 mx-2 my-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
                                        >
                                            <div className="flex items-center gap-3 w-full p-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                                                        {item.title}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                                        {item.subtitle}
                                                    </div>
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            
                            {results.spaces.length > 0 && (
                                <>
                                    {results.properties.length > 0 && <CommandSeparator className="my-3" />}
                                    <CommandGroup heading="Spaces" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 px-3 py-2">
                                        {results.spaces.map((item) => (
                                            <CommandItem
                                                key={item.id}
                                                value={item.title}
                                                onSelect={() => onSelect(item.href)}
                                                onClick={() => handleItemClick(item.href)}
                                                className="cursor-pointer p-0 hover:bg-gray-100 dark:hover:bg-gray-800 data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800 rounded-lg transition-all duration-200 mx-2 my-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 w-full p-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">
                                                        <LucideLandmark className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col flex-1 overflow-hidden">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                                                            {item.title}
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                                            {item.subtitle}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                            
                            {results.tenants.length > 0 && (
                                <>
                                    {(results.properties.length > 0 || results.spaces.length > 0) && 
                                        <CommandSeparator className="my-3" />
                                    }
                                    <CommandGroup heading="Tenants" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 px-3 py-2">
                                        {results.tenants.map((item) => (
                                            <CommandItem
                                                key={item.id}
                                                value={item.title}
                                                onSelect={() => onSelect(item.href)}
                                                onClick={() => handleItemClick(item.href)}
                                                className="cursor-pointer p-0 hover:bg-gray-100 dark:hover:bg-gray-800 data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800 rounded-lg transition-all duration-200 mx-2 my-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 w-full p-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 ring-1 ring-purple-200 dark:ring-purple-800">
                                                        <Users className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col flex-1 overflow-hidden">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                                                            {item.title}
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                                            {item.subtitle}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                            
                            <CommandSeparator className="my-3" />
                            <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-md mx-2 mb-2">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <kbd className="rounded border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 px-1.5 py-0.5 font-mono text-[10px] shadow-sm text-gray-700 dark:text-gray-300">↑↓</kbd>
                                        <span>navigate</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="rounded border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 px-1.5 py-0.5 font-mono text-[10px] shadow-sm text-gray-700 dark:text-gray-300">↵</kbd>
                                        <span>select</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="rounded border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 px-1.5 py-0.5 font-mono text-[10px] shadow-sm text-gray-700 dark:text-gray-300">esc</kbd>
                                        <span>close</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}