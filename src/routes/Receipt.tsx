import { fmtBDT } from "@/lib/data";

export function Receipt({ b }: { b: any }) {
  const items = b.booking_items || [];
  const isDeposit = b.payment_type === "deposit";
  const totalAmount = Number(b.total_amount || 0);
  const amountPaid = Number(b.amount_paid || 0);
  const remainingDue = totalAmount - amountPaid;

  return (
    <div className="receipt-print-only" style={{ padding: '40px', color: '#000', background: '#fff', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#E72E77' }}>EVENTIX</h1>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Official Booking Receipt</p>
        <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
          {isDeposit ? "Deposit Payment" : "Full Payment"} • Receipt #{b.receipt_number}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>Bill To</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{b.profiles?.name || "Customer"}</div>
          <div>{b.contact_phone || "N/A"}</div>
          {b.event_date && (
            <div style={{ marginTop: 8 }}>
              <strong>Event Date:</strong> {new Date(b.event_date).toLocaleDateString('en-GB')}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><strong>Receipt ID:</strong> {b.receipt_number}</div>
          <div><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</div>
          <div><strong>Currency:</strong> {b.currency || "BDT"}</div>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '2px solid #000' }}>
            <th style={{ textAlign: 'left', padding: '12px' }}>Description</th>
            <th style={{ textAlign: 'right', padding: '12px' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '12px' }}>Rate</th>
            <th style={{ textAlign: 'right', padding: '12px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it: any) => (
            <tr key={it.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>
                <div style={{ fontWeight: 'bold' }}>{it.title_snapshot}</div>
              </td>
              <td style={{ textAlign: 'right', padding: '12px' }}>{it.quantity}</td>
              <td style={{ textAlign: 'right', padding: '12px' }}>{fmtBDT(it.unit_price)}</td>
              <td style={{ textAlign: 'right', padding: '12px', fontWeight: 600 }}>
                {fmtBDT(it.line_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ marginLeft: 'auto', width: '320px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
          <span>Subtotal</span>
          <span>{fmtBDT(b.subtotal)}</span>
        </div>

        {b.tax_total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>Tax</span>
            <span>{fmtBDT(b.tax_total)}</span>
          </div>
        )}

        {b.fee_total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>Service Fee</span>
            <span>{fmtBDT(b.fee_total)}</span>
          </div>
        )}

        {b.discount_total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#059669' }}>
            <span>Discount</span>
            <span>-{fmtBDT(b.discount_total)}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', borderTop: '2px solid #000', marginTop: '12px', paddingTop: '12px' }}>
          <span>Total Amount</span>
          <span>{fmtBDT(totalAmount)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: 8, borderTop: '1px solid #ddd' }}>
          <span>Amount Paid</span>
          <strong style={{ color: '#15803d' }}>{fmtBDT(amountPaid)}</strong>
        </div>

        {isDeposit && remainingDue > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#b91c1c', fontWeight: 600 }}>
            <span>Remaining Due</span>
            <span>{fmtBDT(remainingDue)}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '60px', textAlign: 'center', fontSize: '12px', color: '#999', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <p>Thank you for choosing Eventix!</p>
        <p>This is a computer-generated receipt.</p>
      </div>
    </div>
  );
}