"use client"

import { useState, useTransition, useMemo } from "react"
import { format } from "date-fns"
import { MoreHorizontal, Pencil, Trash2, Filter, Printer, Download, CalendarIcon, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { deletePDC, updatePDCStatus } from "@/actions/pdc-actions"

type PDC = {
  id: string
  docDate: Date
  refNo: string
  bankName: string
  dueDate: Date
  checkNo: string
  amount: number
  remarks: string | null
  bpCode: string
  bpName: string
  status: "Open" | "Deposited" | "RETURNED" | "Bounced" | "Cancelled"
  updatedAt: Date
  tenant: {
    company: string | null
    businessName: string
    email: string
  }
  updatedBy: {
    firstName: string
    lastName: string
  }
}

interface PDCTableProps {
  pdcs: PDC[]
}

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

const statusColors = {
  Open: "bg-blue-100 text-blue-800",
  Deposited: "bg-green-100 text-green-800",
  RETURNED: "bg-yellow-100 text-yellow-800",
  Bounced: "bg-red-100 text-red-800",
  Cancelled: "bg-gray-100 text-gray-800",
}

const statusOptions = [
  { value: "Open", label: "Open" },
  { value: "Deposited", label: "Deposited" },
  { value: "RETURNED", label: "Returned" },
  { value: "Bounced", label: "Bounced" },
  { value: "Cancelled", label: "Cancelled" },
]

export function PDCTable({ pdcs }: PDCTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  
  // Filter states
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [bpNameFilter, setBpNameFilter] = useState("")
  const [bankNameFilter, setBankNameFilter] = useState("")
  const [docDateRange, setDocDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [dueDateRange, setDueDateRange] = useState<DateRange>({ from: undefined, to: undefined })

  // Filter PDCs based on all selected filters
  const filteredPDCs = useMemo(() => {
    return pdcs.filter(pdc => {
      // Status filter
      if (statusFilters.length > 0 && !statusFilters.includes(pdc.status)) {
        return false
      }

      // BP Name filter
      if (bpNameFilter && !pdc.bpName.toLowerCase().includes(bpNameFilter.toLowerCase())) {
        return false
      }

      // Bank Name filter
      if (bankNameFilter && !pdc.bankName.toLowerCase().includes(bankNameFilter.toLowerCase())) {
        return false
      }

      // Doc Date range filter
      if (docDateRange.from || docDateRange.to) {
        const docDate = new Date(pdc.docDate)
        if (docDateRange.from && docDate < docDateRange.from) return false
        if (docDateRange.to && docDate > docDateRange.to) return false
      }

      // Due Date range filter
      if (dueDateRange.from || dueDateRange.to) {
        const dueDate = new Date(pdc.dueDate)
        if (dueDateRange.from && dueDate < dueDateRange.from) return false
        if (dueDateRange.to && dueDate > dueDateRange.to) return false
      }

      return true
    })
  }, [pdcs, statusFilters, bpNameFilter, bankNameFilter, docDateRange, dueDateRange])

  // Get unique values for filter options
  const uniqueBankNames = useMemo(() => {
    return Array.from(new Set(pdcs.map(pdc => pdc.bankName))).sort()
  }, [pdcs])

  const uniqueBpNames = useMemo(() => {
    return Array.from(new Set(pdcs.map(pdc => pdc.bpName))).sort()
  }, [pdcs])

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatusFilters(prev => [...prev, status])
    } else {
      setStatusFilters(prev => prev.filter(s => s !== status))
    }
  }

  const clearAllFilters = () => {
    setStatusFilters([])
    setBpNameFilter("")
    setBankNameFilter("")
    setDocDateRange({ from: undefined, to: undefined })
    setDueDateRange({ from: undefined, to: undefined })
  }

  const hasActiveFilters = () => {
    return statusFilters.length > 0 || 
           bpNameFilter !== "" || 
           bankNameFilter !== "" || 
           docDateRange.from || 
           docDateRange.to || 
           dueDateRange.from || 
           dueDateRange.to
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (statusFilters.length > 0) count++
    if (bpNameFilter) count++
    if (bankNameFilter) count++
    if (docDateRange.from || docDateRange.to) count++
    if (dueDateRange.from || dueDateRange.to) count++
    return count
  }

  const handleStatusChange = (id: string, status: PDC["status"]) => {
    startTransition(async () => {
      const result = await updatePDCStatus({ id, status })
      
      if (result.success) {
        toast.success("PDC status updated successfully")
      } else {
        toast.error(result.error || "Failed to update PDC status")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deletePDC(id)
      
      if (result.success) {
        toast.success("PDC deleted successfully")
        setDeleteId(null)
      } else {
        toast.error(result.error || "Failed to delete PDC")
      }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const currentDate = format(new Date(), "EEEE, MMMM dd, yyyy")
    const currentTime = format(new Date(), "hh:mm:ss a")
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PDC ByStatus Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              font-size: 12px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .logo {
              width: 40px;
              height: 40px;
              background: #22c55e;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin: 0;
            }
            .date-time {
              text-align: right;
              font-size: 11px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: left;
              font-size: 10px;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            .amount { text-align: right; }
            .center { text-align: center; }
            .status-open { background-color: #dbeafe; color: #1e40af; }
            .status-deposited { background-color: #dcfce7; color: #166534; }
            .status-returned { background-color: #fef3c7; color: #92400e; }
            .status-bounced { background-color: #fee2e2; color: #dc2626; }
            .status-cancelled { background-color: #f3f4f6; color: #374151; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="logo">📊</div>
              <h1 class="title">PDC ByStatus</h1>
            </div>
            <div class="date-time">
              ${currentDate}<br>
              ${currentTime}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>DocDate</th>
                <th>Ref No</th>
                <th>BankName</th>
                <th>DueDate</th>
                <th>CheckNo</th>
                <th>Amount</th>
                <th>BPName</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPDCs.map((pdc, index) => `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td>${format(new Date(pdc.docDate), "MM/dd/yy")}</td>
                  <td>${pdc.refNo}</td>
                  <td>${pdc.bankName}</td>
                  <td>${format(new Date(pdc.dueDate), "MM/dd/yy")}</td>
                  <td>${pdc.checkNo}</td>
                  <td class="amount">${formatCurrency(pdc.amount)}</td>
                  <td>${pdc.bpName}</td>
                  <td class="center status-${pdc.status.toLowerCase()}">${pdc.status}</td>
                  <td>${pdc.remarks || 'No remarks.'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleExportCSV = () => {
    const headers = [
      'ID', 'DocDate', 'Ref No', 'BankName', 'DueDate', 'CheckNo', 
      'Amount', 'BPName', 'Status', 'Remarks'
    ]

    const csvData = filteredPDCs.map((pdc, index) => [
      index + 1,
      format(new Date(pdc.docDate), "MM/dd/yyyy"),
      pdc.refNo,
      pdc.bankName,
      format(new Date(pdc.dueDate), "MM/dd/yyyy"),
      pdc.checkNo,
      pdc.amount,
      pdc.bpName,
      pdc.status,
      pdc.remarks || 'RENTAL PMT.'
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `PDC_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      {/* Filter and Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filter Options</h4>
                  {hasActiveFilters() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-auto p-1 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Row 1: Text Filters */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Business Partner Filter */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Business Partner</Label>
                    <div className="space-y-1">
                      <Input
                        placeholder="Search by name..."
                        value={bpNameFilter}
                        onChange={(e) => setBpNameFilter(e.target.value)}
                        className="h-7 text-xs"
                      />
                      {bpNameFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBpNameFilter("")}
                          className="h-5 px-1 text-xs"
                        >
                          <X className="mr-1 h-2 w-2" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Bank Name Filter */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Bank Name</Label>
                    <div className="space-y-1">
                      <Input
                        placeholder="Search by bank..."
                        value={bankNameFilter}
                        onChange={(e) => setBankNameFilter(e.target.value)}
                        className="h-7 text-xs"
                      />
                      {bankNameFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBankNameFilter("")}
                          className="h-5 px-1 text-xs"
                        >
                          <X className="mr-1 h-2 w-2" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Row 2: Date Ranges */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Document Date Range Filter */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Document Date</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                            <CalendarIcon className="mr-1 h-2 w-2" />
                            {docDateRange.from ? format(docDateRange.from, "MM/dd") : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={docDateRange.from}
                            onSelect={(date) => setDocDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                            <CalendarIcon className="mr-1 h-2 w-2" />
                            {docDateRange.to ? format(docDateRange.to, "MM/dd") : "To"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={docDateRange.to}
                            onSelect={(date) => setDocDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {(docDateRange.from || docDateRange.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDocDateRange({ from: undefined, to: undefined })}
                        className="h-5 px-1 text-xs"
                      >
                        <X className="mr-1 h-2 w-2" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Due Date Range Filter */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Due Date</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                            <CalendarIcon className="mr-1 h-2 w-2" />
                            {dueDateRange.from ? format(dueDateRange.from, "MM/dd") : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dueDateRange.from}
                            onSelect={(date) => setDueDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                            <CalendarIcon className="mr-1 h-2 w-2" />
                            {dueDateRange.to ? format(dueDateRange.to, "MM/dd") : "To"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dueDateRange.to}
                            onSelect={(date) => setDueDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {(dueDateRange.from || dueDateRange.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDueDateRange({ from: undefined, to: undefined })}
                        className="h-5 px-1 text-xs"
                      >
                        <X className="mr-1 h-2 w-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                  
                </div>
                

                <Separator />

                {/* Row 3: Status Filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Status</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {statusOptions.map((status) => (
                      <div key={status.value} className="flex items-center space-x-1.5">
                        <Checkbox
                          id={status.value}
                          checked={statusFilters.includes(status.value)}
                          onCheckedChange={(checked) => 
                            handleStatusFilterChange(status.value, checked as boolean)
                          }
                          className="h-3 w-3"
                        />
                        <Label htmlFor={status.value} className="text-xs leading-none">
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters() && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredPDCs.length} of {pdcs.length} records
            </div>
          )}
        </div>
             <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

   
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc Date</TableHead>
              <TableHead>Ref No.</TableHead>
              <TableHead>Business Partner</TableHead>
              <TableHead>Bank Name</TableHead>
              <TableHead>Check No.</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-center">Amount</TableHead>
              <TableHead className="w-[120px]">Remarks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPDCs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  {hasActiveFilters() ? "No PDCs found matching the selected filters." : "No PDCs found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredPDCs.map((pdc) => (
                <TableRow key={pdc.id}>
                  <TableCell>
                    {format(new Date(pdc.docDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{pdc.refNo}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pdc.bpName}</div>
                      <div className="text-sm text-muted-foreground">
                        {pdc.bpCode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{pdc.bankName}</TableCell>
                  <TableCell>{pdc.checkNo}</TableCell>
                  <TableCell>
                    {format(new Date(pdc.dueDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {formatCurrency(pdc.amount)}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {pdc.remarks ? pdc.remarks : "No remarks."}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={pdc.status}
                      onValueChange={(value) => handleStatusChange(pdc.id, value as PDC["status"])}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue>
                          <Badge className={statusColors[pdc.status]}>
                            {pdc.status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Deposited">Deposited</SelectItem>
                        <SelectItem value="RETURNED">Returned</SelectItem>
                        <SelectItem value="Bounced">Bounced</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {pdc.updatedBy.firstName} {pdc.updatedBy.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(pdc.updatedAt), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(pdc.refNo)}
                        >
                          Copy reference number
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteId(pdc.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the PDC
              record from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}