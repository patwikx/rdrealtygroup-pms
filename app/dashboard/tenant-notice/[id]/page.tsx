"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { getTenantNoticeById } from "@/actions/tenant-notice";

interface NoticeDetail {
  id: string;
  noticeType: string;
  noticeNumber: number;
  totalAmount: number;
  forMonth: string;
  forYear: number;
  dateIssued: Date;
  isSettled: boolean;
  settledDate: Date | null;
  primarySignatory: string;
  primaryTitle: string;
  primaryContact: string;
  secondarySignatory: string;
  secondaryTitle: string;
  tenant: {
    id: string;
    bpCode: string;
    businessName: string;
    company: string;
    firstName: string | null;
    lastName: string | null;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
  items: {
    id: string;
    description: string;
    status: string;
    customStatus: string | null;
    amount: number;
    months: string | null;
  }[];
}

export default function NoticeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotice = async () => {
      try {
        const noticeData = await getTenantNoticeById(params.id);
        setNotice(noticeData as NoticeDetail);
      } catch (error) {
        toast.error("Failed to load notice");
        router.push("/dashboard/tenant-notice");
      } finally {
        setLoading(false);
      }
    };
    loadNotice();
  }, [params.id, router]);

  const handlePrint = () => {
    window.print();
  };

  const getNoticeTitle = (type: string, number: number) => {
    if (number >= 3 || type === "FINAL_NOTICE") {
      return "FINAL NOTICE AND WARNING";
    }
    return number === 1 ? "First Notice of Collection" : "Second Notice of Collection";
  };

  const getNoticeContent = (type: string, number: number) => {
    const formattedAmount = `₱${notice?.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    if (number >= 3 || type === "FINAL_NOTICE") {
      return {
        beforeAmount: "Our records show that to date, we have not yet received the full payment of your outstanding balance amounting to ",
        amount: formattedAmount,
        afterAmount: ", despite repeated demands. Below listed are the details of your unsettled account:"
      };
    }
    
    return {
      beforeAmount: "This is to remind you of your unsettled accounts with RD Realty Development Corporation amounting to ",
      amount: formattedAmount,
      afterAmount: ". Below listed are the details to wit:"
    };
  };

  const getFinalNoticeWarning = () => {
    return {
      beforeWarning: "This is a ",
      warning: "WARNING",
      afterWarning: " for you to settle your balance immediately from the receipt of this notice. We are letting you know that this is your last and final opportunity to negotiate with the company concerning your outstanding obligations. We hope that this time, you will settle to avoid any inconvenience in the future."
    };
  };

  // Function to get signature image based on signatory name
  const getSignatureImage = (signatoryName: string) => {
    const normalizedName = signatoryName.toLowerCase().replace(/\s+/g, '');
    
    // Check for common variations of the names
    if (normalizedName.includes('daryll') || normalizedName.includes('daryl')) {
      return '/DJE.png'; // Adjust filename as needed
    } else if (normalizedName.includes('laguindam') || normalizedName.includes('cab') || normalizedName.includes('c.a.b')) {
      return '/CABL.png'; // Adjust filename as needed
    }
    
    return null; // No signature found
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading notice...</div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Notice not found</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.25in;
            size: 8.5in 11in;
          }
          /* Print spacing adjustments */
          .print-area {
            padding: 0.1in 0.15in !important;
          }
          /* Force colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ensure yellow background prints */
          .print-yellow {
            background-color: #fef08a !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure red text prints */
          .print-red {
            color: #dc2626 !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure blue text prints */
          .print-blue {
            color: #2563eb !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure light blue text prints */
          .print-light-blue {
            color: #60a5fa !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Ensure navy blue text prints */
          .print-navy-blue {
            color: #1e3a8a !important;
            -webkit-print-color-adjust: exact !important;
          }
          /* Signature styling for print */
          .signature-container {
            position: relative;
          }
          .signature-image {
            position: absolute;
            top: -25px;
            left: 0;
            z-index: 1;
          }
          .signatory-name {
            position: relative;
            z-index: 2;
          }
        }
        
        /* Custom text justification styles */
        .text-justify-full {
          text-align: justify;
          text-justify: inter-word;
          hyphens: auto;
          -webkit-hyphens: auto;
          -ms-hyphens: auto;
        }
        
        .text-justify-full:after {
          content: "";
          display: inline-block;
          width: 100%;
        }

        /* Signature styling for screen */
        .signature-container {
          position: relative;
        }
        .signature-image {
          position: absolute;
          top: -25px;
          left: 0;
          z-index: 1;
        }
        .signatory-name {
          position: relative;
          z-index: 2;
        }
      `}</style>
      
      <div className="container mx-auto py-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notices
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Notice Document */}
        <div className="print-area max-w-4xl mx-auto bg-white print:shadow-none print:max-w-none print:mx-0">
          <div className="p-8 print:p-1 print:pt-6">
            {/* Header with embedded content */}
            <div className="flex justify-between items-start">
              {/* Left side - Date, Company, and Content */}
              <div className="flex-1 print:pl-0">
                {/* Date and Company Info */}
                <div className="text-sm mb-3">{new Date(notice.dateIssued).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: '2-digit' 
                })}</div>
                <div className="font-bold text-lg mb-1">{notice.tenant.businessName.toUpperCase()}</div>
                <div className="text-sm mb-6">General Santos City</div>
                
                {/* Title - now positioned at the same level as Philippines */}
                <div className="text-center mb-4 mt-16">
                  <h2 className="text-base font-bold underline ml-48">
                    {getNoticeTitle(notice.noticeType, notice.noticeNumber)}
                  </h2>
                </div>
                
                {/* Salutation */}
                <div className="mt-6">
                  <p className="text-sm">Dear Sir/Ma&apos;am:</p>
                </div>
              </div>
              
              {/* Right side - Company Header */}
              <div className="text-right mr-[-20px] mt-[-30px] print:pr-1">
                <div className="mb-1 flex items-center justify-center">
                  <Image 
                    src='/rdrdc.png' 
                    alt="RD Realty Development Corporation Logo" 
                    width={80}
                    height={80}
                    className="object-contain"
                    unoptimized={true}
                    onError={(e) => {
                      console.error('Logo failed to load:', e);
                    }}
                  />
                </div>
                <div className="text-sm font-bold mb-1 text-center">RD Realty Development Corporation</div>
                <div className="border-b border-gray-400 mb-1"></div>
                <div className="text-xs text-gray-500 leading-tight text-left">
                  Cagampang Ext., Santiago Subdivision<br />
                  Brgy. Bula, General Santos City 9500<br />
                  Philippines<br />
                  Tel +6383 552 4435<br />
                  Fax +6383 301 2386<br />
                  www.rdrealty.ph
                </div>
                <div className="border-b border-gray-400 mt-1"></div>
              </div>
            </div>

            {/* Content - Full Width Outside Flex Container */}
            <div className="leading-normal text-sm mb-[-20px]" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
              <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                {getNoticeContent(notice.noticeType, notice.noticeNumber).beforeAmount}
                <span className="font-bold underline">
                  {getNoticeContent(notice.noticeType, notice.noticeNumber).amount}
                </span>
                {getNoticeContent(notice.noticeType, notice.noticeNumber).afterAmount}
              </p>
            </div>

            {/* Amount Table */}
            <div className="mb-6 mt-6">
              <table className="w-full border-collapse">
                <tbody>
                  {notice.items?.map((item, index) => {
                    const displayStatus = item.status === "CUSTOM" && item.customStatus 
                      ? item.customStatus 
                      : item.status.replace('_', ' ');
                    const displayMonths = item.months || `${notice.forMonth} ${notice.forYear}`;
                    
                    return (
                      <tr key={item.id} className="border-b border-black">
                        <td className="px-2 py-2 font-semibold text-sm">{item.description}</td>
                        <td className="px-2 py-2 font-semibold text-center text-sm">{displayStatus}</td>
                        <td className="px-2 py-2 font-semibold text-center text-sm">{displayMonths}</td>
                        <td className="px-2 py-2 font-semibold text-right text-sm">₱{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-yellow-200 print-yellow border-b border-black">
                    <td className="px-2 py-2 font-bold text-sm" colSpan={3}>Total Outstanding Balance</td>
                    <td className="px-2 py-2 font-bold text-right text-sm">₱{notice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Second paragraph for first/second notices */}
            {(notice.noticeNumber < 3 && notice.noticeType !== "FINAL_NOTICE") && (
              <div className="mb-6 text-justify-full leading-normal text-sm" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>We kindly request that you make immediate payment to prevent the imposition of interest and penalty charges. If you have any questions or concerns about your account, please don&apos;t hesitate to reach out to us. Your prompt attention to this matter is greatly appreciated. Thank you.</p>
              </div>
            )}

            {/* Final notice warning - appears after table */}
            {(notice.noticeNumber >= 3 || notice.noticeType === "FINAL_NOTICE") && (
              <div className="mb-6 text-justify-full leading-normal text-sm" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                <p style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                  {getFinalNoticeWarning().beforeWarning}
                  <span className="font-bold">
                    {getFinalNoticeWarning().warning}
                  </span>
                  {getFinalNoticeWarning().afterWarning}
                </p>
              </div>
            )}

            {/* Closing */}
            <div className="mb-12">
              <p className="text-sm">Very truly yours,</p>
            </div>

            {/* Signatories */}
            <div className="mb-8">
              {/* Primary Signatory */}
              <div className="mb-8 signature-container">
                {getSignatureImage(notice.primarySignatory) && (
                  <Image 
                    src={getSignatureImage(notice.primarySignatory)!}
                    alt={`${notice.primarySignatory} signature`}
                    width={120}
                    height={40}
                    className="signature-image mt-[-75px] ml-4 object-contain"
                    unoptimized={true}
                    onError={(e) => {
                      console.error('Primary signature failed to load:', e);
                    }}
                  />
                )}
                <div className="font-bold underline text-sm signatory-name">{notice.primarySignatory}</div>
                <div className="text-sm">{notice.primaryTitle}</div>
                <div className="text-sm">Mobile: {notice.primaryContact}</div>
              </div>
              
              <div className="mb-2">
                <div className="text-sm">Noted By:</div>
              </div>
              
              {/* Secondary Signatory */}
              <div className="mt-8 signature-container">
                {getSignatureImage(notice.secondarySignatory) && (
                  <Image 
                    src={getSignatureImage(notice.secondarySignatory)!}
                    alt={`${notice.secondarySignatory} signature`}
                    width={150}
                    height={60}
                    className="signature-image mt-[-20px] mr-6 object-contain"
                    unoptimized={true}
                    onError={(e) => {
                      console.error('Secondary signature failed to load:', e);
                    }}
                  />
                )}
                <div className="font-bold underline text-sm signatory-name">{notice.secondarySignatory}</div>
                <div className="text-sm">{notice.secondaryTitle}</div>
              </div>
            </div>

            {/* Received Section */}
            <div className="mb-6">
              <div className="flex justify-between items-end">
                <div className="flex-1 mr-8">
                  <div className="text-sm">Received by: ________________________________</div>
                  <div className="text-center text-xs mt-1">Printed Name/ Signature/ CP No.</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm">________________________________</div>
                  <div className="text-xs mt-1">Date/Time</div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-20 text-xs text-red-500 print-red leading-tight">
              <p className="font-semibold">NOTE: PLEASE SUBMIT BIR FORM 2307 SO WE CAN DEDUCT IT FROM YOUR ACCOUNT.</p>
              <p className="text-blue-400 print-light-blue">Should payment have been made thru the bank, kindly send proof of payment to <span className="underline text-blue-900 print-navy-blue">collectiongroup@rdrealty.com.ph</span></p>
              <p className="italic text-blue-900 print-navy-blue">Thank you!</p>
            </div>

            {/* Status Badge - Only show on screen, not in print */}
            {notice.isSettled && (
              <div className="mt-4 text-center print:hidden">
                <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                  SETTLED - {notice.settledDate ? new Date(notice.settledDate).toLocaleDateString() : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}