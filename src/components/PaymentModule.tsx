import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Activity, 
  Check, 
  X, 
  ArrowRight,
  Info,
  AlertOctagon,
  RefreshCcw,
  Download,
  Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentModuleProps {
  isOpen: boolean;
  onClose: () => void;
  fee: number;
  doctorName: string;
  specialization: string;
  dateTime: string;
  appointmentId: string;
  onPaymentSuccess: (receipt: {
    txId: string;
    amount: number;
    billingName: string;
    createdAt: string;
    isSubscription?: boolean;
    subscriptionId?: string;
  }) => void;
}

export default function PaymentModule({
  isOpen,
  onClose,
  fee,
  doctorName,
  specialization,
  dateTime,
  appointmentId,
  onPaymentSuccess
}: PaymentModuleProps) {
  const [checkoutStep, setCheckoutStep] = useState<'billing' | 'processing' | 'receipt' | 'failed'>('billing');
  const [billingName, setBillingName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isSubscription, setIsSubscription] = useState(false);
  const [processingPhase, setProcessingPhase] = useState(0);
  const [checkoutError, setCheckoutError] = useState('');
  const [txId, setTxId] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');

  // Auto-format card number as they type (4-4-4-4 spacing)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Allow only digits
    if (val.length > 16) val = val.substring(0, 16);
    
    // Add spaces every 4 characters
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = val.length; i < len; i += 4) {
      parts.push(val.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(val);
    }
  };

  // Auto-format expiration date as MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Allow only digits
    if (val.length > 4) val = val.substring(0, 4);
    
    if (val.length >= 2) {
      setCardExpiry(val.substring(0, 2) + '/' + val.substring(2));
    } else {
      setCardExpiry(val);
    }
  };

  // Pre-fill button for fast sandbox testing
  const handlePrefillCard = () => {
    setBillingName('Johnathon Doe');
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvv('123');
    setCheckoutError('');
  };

  const handleValidationAndProcessing = () => {
    setCheckoutError('');

    // Field validity checks
    if (!billingName.trim()) {
      setCheckoutError('Please enter the cardholder full name.');
      return;
    }

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length !== 16) {
      setCheckoutError('Please enter a valid 16-digit credit card number.');
      return;
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (!expiryRegex.test(cardExpiry)) {
      setCheckoutError('Expiration date must match the MM/YY format (e.g. 12/28).');
      return;
    }

    const cleanCvv = cardCvv.replace(/\D/g, '');
    if (cleanCvv.length !== 3) {
      setCheckoutError('CVV code must be exactly 3 digits.');
      return;
    }

    // Initialize Processing Flow
    setCheckoutStep('processing');
    setProcessingPhase(1);

    // Simulate Network Request and Pipeline
    const p1 = setTimeout(() => {
      setProcessingPhase(2);
    }, 1000);

    const p2 = setTimeout(() => {
      setProcessingPhase(3);
    }, 2000);

    const p3 = setTimeout(() => {
      // Simulate Payment Failure if CVV is '000'
      if (cleanCvv === '000') {
        setCheckoutStep('failed');
        return;
      }

      const generatedId = `TXN-509-${Math.floor(100000 + Math.random() * 900000)}`;
      const genSubId = isSubscription ? `SUB-${Math.floor(10000 + Math.random() * 90000)}` : '';
      setTxId(generatedId);
      if (isSubscription) setSubscriptionId(genSubId);
      
      setCheckoutStep('receipt');
      
      onPaymentSuccess({
        txId: generatedId,
        amount: fee,
        billingName: billingName.trim(),
        createdAt: new Date().toISOString(),
        isSubscription,
        subscriptionId: genSubId
      });
    }, 3200);
  };

  const printReceipt = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    
    const receiptHtml = `
      <html>
        <head>
          <title>MedCare Digital Receipt - ${txId}</title>
          <style>
            body { font-family: monospace; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; }
            h1 { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
            .label { font-weight: bold; color: #64748b; }
            .value { font-weight: bold; text-align: right; }
            .total { font-size: 1.5em; border-top: 2px dashed #cbd5e1; padding-top: 20px; margin-top: 30px; border-bottom: none; }
          </style>
        </head>
        <body>
          <h1>MedCare AIO Digital Receipt</h1>
          <div class="row"><span class="label">Transaction ID:</span> <span class="value">${txId}</span></div>
          ${isSubscription ? `<div class="row"><span class="label">Subscription ID:</span> <span class="value">${subscriptionId}</span></div>` : ''}
          <div class="row"><span class="label">Consult ID:</span> <span class="value">${appointmentId}</span></div>
          <div class="row"><span class="label">Date:</span> <span class="value">${new Date().toLocaleString()}</span></div>
          <div class="row"><span class="label">Specialist Name:</span> <span class="value">${doctorName}</span></div>
          <div class="row"><span class="label">Target Timeframe:</span> <span class="value">${dateTime}</span></div>
          <div class="row"><span class="label">Cardholder:</span> <span class="value">${billingName.toUpperCase()}</span></div>
          <div class="row total"><span class="label">Total Charged:</span> <span class="value">$${fee.toFixed(2)}${isSubscription ? ' / mo' : ''}</span></div>
          <p style="text-align: center; margin-top: 50px; color: #94a3b8;">This document is generated for your records. Please retain.</p>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  useEffect(() => {
    if (isOpen) {
      // Keep state fresh per open
      setCheckoutStep('billing');
      setBillingName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setIsSubscription(false);
      setProcessingPhase(0);
      setCheckoutError('');
      setTxId('');
      setSubscriptionId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        id="payment-module-modal"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4.5 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-2">
            <div className="bg-teal-50 dark:bg-teal-950/50 text-teal-650 dark:text-teal-400 p-1.5 rounded-lg border border-teal-100 dark:border-teal-900/50">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white text-sm">MedCare Stripe Sandbox Portal</h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">SECURE SSL CIPHER HANDSHAKE INTEGRITY ACTIVE</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Panel */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {checkoutStep === 'billing' && (
            <div className="space-y-5" id="stripe-checkout-billing-form">
              {/* Checkout header alert */}
              <div className="bg-teal-50 dark:bg-teal-950/20 p-3 rounded-lg border border-teal-500/15 text-[11px] text-slate-650 dark:text-slate-405 flex items-start gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-teal-605 shrink-0" />
                <div>
                  <p className="font-bold text-teal-850 dark:text-teal-405">Stripe Integrated Sandbox Simulation</p>
                  <p className="mt-0.5 leading-relaxed">
                    Test clinician session billing instantly. Press the **Load Sandbox Card** button below to auto-fill mock credentials and avoid redundant keystrokes.
                  </p>
                </div>
              </div>

              {/* Consultation specifics card */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-855 text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 border-r border-slate-200 dark:border-slate-850/60 pr-2">
                  <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold">Consultation Specs</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{doctorName}</p>
                  <p className="text-slate-500 text-[11px]">{specialization} Division</p>
                  <p className="text-slate-505 dark:text-slate-400 font-mono text-[10px]">{dateTime}</p>
                </div>
                <div className="flex flex-col justify-between items-start md:items-end">
                  <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold">Consolidated Rates</span>
                  <div className="mt-2 text-right">
                    <span className="text-slate-400 text-[10px] block">STANDARD FEE</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">${fee.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Graphic Credit Card Display */}
              <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white rounded-xl p-5 border border-slate-700 shadow-lg h-44 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
                
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono tracking-widest text-teal-450 uppercase font-bold">MEDCARE SECURE CO</span>
                    <div className="h-6 w-8 bg-amber-500/20 border border-amber-500/30 rounded"></div>
                  </div>
                  <span className="font-black text-slate-450 italic tracking-widest text-sm">VISA</span>
                </div>

                <p className="font-mono text-base tracking-widest my-2">
                  {cardNumber || '•••• •••• •••• ••••'}
                </p>

                <div className="flex justify-between items-end text-[10px] font-mono text-slate-400">
                  <div>
                    <span className="text-[8px] block uppercase font-bold tracking-wider">Cardholder</span>
                    <span className="font-bold uppercase text-white truncate max-w-[150px] inline-block">
                      {billingName || 'JOHNATHON DOE'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] block uppercase font-bold tracking-wider font-sans">Expires</span>
                    <span className="font-bold text-white">
                      {cardExpiry || 'MM/YY'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input Form Fields */}
              <div className="space-y-3.5 text-xs">
                {checkoutError && (
                  <div className="p-3 bg-rose-50 text-rose-800 border border-rose-220 text-xs rounded-lg flex items-center gap-1.5 hover:border-rose-400 transition" id="billing-error-box">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{checkoutError}</span>
                  </div>
                )}

                {/* Billing Name */}
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider font-mono text-[9px] block">1. Cardholder Full Name</label>
                  <input
                    type="text"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-slate-50 dark:bg-slate-950 dark:text-white focus:bg-white focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Johnathon Doe"
                  />
                </div>

                {/* Card Number */}
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider font-mono text-[9px] block">2. Credit Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-slate-50 dark:bg-slate-950 dark:text-white focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono tracking-widest text-sm"
                    placeholder="4242 4242 4242 4242"
                  />
                </div>

                {/* Expiry & CVC Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-505 font-bold uppercase tracking-wider font-mono text-[9px] block">3. Expiration Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-slate-50 dark:bg-slate-950 dark:text-white focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono text-center tracking-medium"
                      placeholder="MM/YY"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-505 font-bold uppercase tracking-wider font-mono text-[9px] block">4. CVV Security Code</label>
                    <input
                      type="password"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-slate-50 dark:bg-slate-950 dark:text-white focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono text-center"
                      placeholder="3-Digits"
                    />
                  </div>
                </div>

                {/* Subscription Toggle */}
                <div className="pt-2 flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-md text-indigo-600 dark:text-indigo-400">
                      <Repeat className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs">Enable Auto-Renew</h4>
                      <p className="text-[10px] text-slate-500 leading-tight">Bill {doctorName} automatically</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isSubscription} onChange={(e) => setIsSubscription(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
              </div>

              {/* Action Section */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrefillCard}
                  className="px-3.5 py-2.5 text-xs font-mono font-bold tracking-tight text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-400 border border-teal-200/40 dark:border-teal-900/50 rounded-lg transition-colors cursor-pointer"
                >
                  Load Sandbox Card
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:text-slate-400 text-slate-555 rounded-lg text-xs font-semibold hover:text-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleValidationAndProcessing}
                    className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold font-mono tracking-medium shadow-md transitionactive:scale-[0.98] border border-teal-500 cursor-pointer select-none"
                  >
                    <span>Complete Checkout</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center" id="stripe-checkout-processing-pane">
              <div className="relative">
                <Activity className="h-11 w-11 text-teal-605 animate-pulse" />
                <div className="absolute inset-0 border-2 border-teal-505/20 border-t-teal-500 rounded-full animate-spin"></div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-mono font-bold text-slate-900 dark:text-white text-base">Contacting Stripe Sandbox APIs...</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Invoking secure virtual charge pipelines, hashing credentials, and committing transaction identifiers to local storage ledgers.
                </p>
              </div>

              {/* Status checklist metrics */}
              <div className="w-full max-w-xs space-y-2 text-left text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-400 uppercase tracking-widest text-[8px]">Stripe Pipeline Logs</span>
                  <span className="font-mono text-[9px] text-teal-655 font-bold">{processingPhase}/3 steps complete</span>
                </div>

                <div className="space-y-2 font-mono text-[10.5px] pt-1.5 border-t border-slate-200 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    {processingPhase >= 1 ? (
                      <div className="h-4 w-4 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 text-[8px] font-bold">✓</div>
                    ) : (
                      <div className="h-4 w-4 border border-dashed border-slate-350 rounded-full animate-spin"></div>
                    )}
                    <span className={processingPhase >= 1 ? "text-slate-800 dark:text-white font-medium" : "text-slate-400"}>1. Sharded JWT validation active...</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {processingPhase >= 2 ? (
                      <div className="h-4 w-4 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 text-[8px] font-bold">✓</div>
                    ) : (
                      <div className={`h-4 w-4 border border-dashed rounded-full ${processingPhase === 1 ? 'border-teal-500 animate-spin' : 'border-slate-300'}`}></div>
                    )}
                    <span className={processingPhase >= 2 ? "text-slate-800 dark:text-white font-medium" : "text-slate-400"}>2. Authorized mock token hook...</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {processingPhase >= 3 ? (
                      <div className="h-4 w-4 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 text-[8px] font-bold">✓</div>
                    ) : (
                      <div className={`h-4 w-4 border border-dashed rounded-full ${processingPhase === 2 ? 'border-teal-500 animate-spin' : 'border-slate-300'}`}></div>
                    )}
                    <span className={processingPhase >= 3 ? "text-slate-800 dark:text-white font-medium" : "text-slate-400"}>3. Committed local index record...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'failed' && (
            <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center h-full" id="stripe-checkout-failed-pane">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                <AlertOctagon className="h-8 w-8 font-bold" />
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Transaction Declined</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The payment gateway rejected the charge. Typically this happens when CVV is invalid or the mock bank declines the test card. Your card has not been charged.
                </p>
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-4 rounded-xl text-left w-full max-w-sm">
                 <p className="text-rose-800 dark:text-rose-400 text-xs font-mono font-bold uppercase tracking-widest mb-1 text-[9px]">Error Trace</p>
                 <p className="text-rose-700 dark:text-rose-300 font-mono text-xs">ERR_DECLINED_BY_NETWORK [CVV_MISMATCH]</p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutStep('billing');
                    setProcessingPhase(0);
                  }}
                  className="flex-1 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-md"
                >
                  <RefreshCcw className="h-4 w-4 shrink-0" />
                  <span>Retry Payment</span>
                </button>
              </div>
            </div>
          )}

          {checkoutStep === 'receipt' && (
            <div className="space-y-6 py-2 text-center" id="stripe-checkout-receipt-pane">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
                <Check className="h-6 w-6 font-bold" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Transaction Swapped & Audited</h3>
                <p className="text-xs text-slate-500">Receipt committed instantly under transaction index hashes.</p>
              </div>

              {/* Digital receipt box */}
              <div className="bg-slate-950 text-slate-300 rounded-xl p-5 border-t-8 border-teal-500 border border-slate-850 space-y-3.5 max-w-sm mx-auto shadow-md relative overflow-hidden font-mono text-left text-[11px]">
                <div className="absolute top-1 right-2 bg-emerald-500/10 text-emerald-400 text-[8px] border border-emerald-500/35 px-1 rounded font-black tracking-widest uppercase">sys_ledger_synced</div>
                
                <div className="text-center font-bold pb-2.5 border-b border-dashed border-slate-800 pt-2">
                  <h4 className="text-white text-xs font-bold tracking-tight">MedCare AIO Digital Receipt</h4>
                  <p className="text-[9px] text-slate-500 italic mt-0.5">Verified sandbox ledger documentation</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-bold text-teal-400">{txId}</span>
                  </div>
                  {isSubscription && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subscription ID:</span>
                      <span className="font-bold text-indigo-400">{subscriptionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consult ID Link:</span>
                    <span className="font-bold text-white">{appointmentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Specialist Name:</span>
                    <span className="font-bold text-white">{doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Specialization:</span>
                    <span className="font-bold text-white">{specialization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Timeframe:</span>
                    <span className="font-bold text-white truncate max-w-[200px] inline-block">{dateTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cardholder:</span>
                    <span className="font-bold text-white uppercase">{billingName}</span>
                  </div>
                  
                  <div className="pt-2.5 border-t border-dashed border-slate-800 flex justify-between items-baseline">
                    <span className="font-bold text-slate-400">Total Charged{isSubscription ? ' (Monthly)' : ''}:</span>
                    <span className="text-sm font-black text-teal-400 font-mono">${fee.toFixed(2)}{isSubscription ? ' / mo' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  type="button"
                  onClick={printReceipt}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-[11px] transition flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-mono font-bold rounded-lg text-xs tracking-wider border-none shadow-sm transition active:scale-95"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
