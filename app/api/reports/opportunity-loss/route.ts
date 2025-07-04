import { NextResponse } from 'next/server';
import { generateOpportunityLossCSV } from '@/lib/reports/opportunity-loss';

export async function GET() {
  try {
    const csvData = await generateOpportunityLossCSV();
    
    // Prepare CSV response
    const headers = {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="opportunity_loss_report_${new Date().toISOString().slice(0, 10)}.csv"`
    };
    
    return new NextResponse(csvData, { 
      status: 200, 
      headers 
    });
  } catch (error) {
    console.error('Error generating opportunity loss report:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}