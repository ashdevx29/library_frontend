import React, { useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDownload, FiPrinter, FiRotateCcw, FiFileText, FiImage, FiCheckCircle, FiShield } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import { getPhotoUrl } from '../../utils/image';
import { toPng } from 'html-to-image';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const ORANGE = '#FF6B00';
const DARK = '#1E293B';
const GRAY = '#64748B';
const LIGHT_GRAY = '#F1F5F9';

export default function IdCardGenerator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const { data: cardData, isLoading, error } = useQuery({
    queryKey: ['card-data', id],
    queryFn: async () => {
      const { data } = await api.get(`/members/${id}/card-data`);
      return data.data;
    },
    enabled: !!id,
  });

  const downloadPNG = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading('png');
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `member-card-${cardData?.fullName?.replace(/\s+/g, '-').toLowerCase() || id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('PNG download failed', e);
    }
    setDownloading(null);
  }, [cardData, id]);

  const downloadPDF = () => {
    setDownloading('pdf');
    const a = document.createElement('a');
    a.href = `${api.defaults.baseURL}/members/${id}/card`;
    a.download = `member-card-${id}.pdf`;
    a.click();
    setTimeout(() => setDownloading(null), 1000);
  };

  const printCard = () => {
    window.print();
  };

  if (isLoading) return <PageLoader />;
  if (error || !cardData) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 p-6">
        <FiShield size={40} className="text-red-400" />
        <p className="text-sm text-red-500">Failed to load card data</p>
        <button onClick={() => navigate(-1)} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold">Go Back</button>
      </div>
    );
  }

  const qrValue = JSON.stringify({ id: cardData._id, memberId: cardData.memberId });
  const photoSrc = getPhotoUrl(cardData.photo, cardData.fullName);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 hover:bg-[var(--bg-hover)]"><FiArrowLeft size={16} /></button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">ID Card Generator</h1>
            <p className="text-sm text-[var(--text-muted)]">{cardData.fullName} &middot; {cardData.memberId}</p>
          </div>
        </div>

        <div className="flex gap-2" data-no-print>
          <button onClick={() => setFlipped(!flipped)} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
            <FiRotateCcw size={14} /> {flipped ? 'Front' : 'Back'}
          </button>
          <button onClick={downloadPNG} disabled={downloading === 'png'} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50">
            <FiImage size={14} /> {downloading === 'png' ? 'Generating...' : 'PNG'}
          </button>
          <button onClick={downloadPDF} disabled={downloading === 'pdf'} className="flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-600 disabled:opacity-50">
            <FiFileText size={14} /> {downloading === 'pdf' ? 'Downloading...' : 'PDF'}
          </button>
          <button onClick={printCard} className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600">
            <FiPrinter size={14} /> Print
          </button>
        </div>
      </div>

      {/* Card preview */}
      <div className="flex justify-center">
        <div className="relative" style={{ perspective: '1000px' }}>
          <motion.div
            ref={cardRef}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
            className="relative"
            style={{ transformStyle: 'preserve-3d', width: '510px', height: '324px' }}
          >
            {/* ──────── FRONT SIDE ──────── */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-gray-200 shadow-xl" style={{ backfaceVisibility: 'hidden', backgroundColor: LIGHT_GRAY }}>
              {/* Header bar */}
              <div className="flex h-[66px] items-center justify-center" style={{ backgroundColor: ORANGE }}>
                <div className="text-center">
                  <div className="text-lg font-extrabold tracking-wide text-white">{cardData.library.name.toUpperCase()}</div>
                  <div className="text-[10px] font-medium text-white/90">MEMBER IDENTITY CARD</div>
                </div>
              </div>

              <div className="flex p-4" style={{ height: 'calc(100% - 66px - 4px)' }}>
                {/* Left side - details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-[10px]">
                    <DetailRow label="FULL NAME" value={cardData.fullName} />
                    <DetailRow label="MEMBER ID" value={cardData.memberId} />
                    <DetailRow label="SEAT" value={cardData.seat ? `${cardData.seat.number} (Floor ${cardData.seat.floor})` : 'Unassigned'} />
                    <DetailRow label="SHIFT" value={cardData.shift ? `${cardData.shift.name} (${cardData.shift.startTime} - ${cardData.shift.endTime})` : '-'} />
                    <DetailRow label="EXPIRY DATE" value={formatDate(cardData.membershipExpiryDate)} />
                  </div>

                  {/* QR Code */}
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border-2 border-gray-200 bg-white p-1" style={{ borderColor: ORANGE }}>
                      <QRCodeCanvas value={qrValue} size={54} fgColor={DARK} bgColor="#FFFFFF" level="M" />
                    </div>
                    <div className="text-[7px] font-medium" style={{ color: GRAY }}>Scan to<br />verify</div>
                  </div>
                </div>

                {/* Right side - photo */}
                <div className="ml-4 flex flex-col items-center">
                  <div className="overflow-hidden rounded-xl border-2" style={{ borderColor: ORANGE, width: '120px', height: '126px' }}>
                    <img src={photoSrc} alt={cardData.fullName} className="h-full w-full object-cover" />
                  </div>
                  <div className="mt-1 text-[9px] font-semibold" style={{ color: GRAY }}>{cardData.membershipPlan}</div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[4px]" style={{ backgroundColor: ORANGE }} />
            </div>

            {/* ──────── BACK SIDE ──────── */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              {/* Header */}
              <div className="flex h-[54px] items-center justify-center" style={{ backgroundColor: ORANGE }}>
                <div className="text-center">
                  <div className="text-sm font-extrabold tracking-wide text-white">{cardData.library.name.toUpperCase()}</div>
                  <div className="text-[9px] font-medium text-white/90">VERIFICATION & CONTACT</div>
                </div>
              </div>

              <div className="flex gap-4 p-4" style={{ height: 'calc(100% - 54px - 4px)' }}>
                {/* Left column - Emergency Contact */}
                <div className="flex-1">
                  <div className="mb-3 text-[10px] font-bold tracking-wide" style={{ color: ORANGE }}>EMERGENCY CONTACT</div>
                  <div className="space-y-3">
                    <DetailSmall label="Name" value={cardData.fullName} />
                    <DetailSmall label="Phone" value={cardData.mobile} />
                    <DetailSmall label="Email" value={cardData.email || '-'} />
                  </div>

                  <div className="mt-5 mb-3 text-[10px] font-bold tracking-wide" style={{ color: ORANGE }}>LIBRARY ADDRESS</div>
                  <div className="text-[9px]" style={{ color: DARK }}>
                    <p className="font-semibold">{cardData.library.name}</p>
                    <p style={{ color: GRAY }}>{cardData.library.address || '-'}</p>
                    <p className="mt-1" style={{ color: GRAY }}>Ph: {cardData.library.mobile || '-'}</p>
                    <p style={{ color: GRAY }}>Email: {cardData.library.email || '-'}</p>
                  </div>
                </div>

                {/* Right column - QR Verification */}
                <div className="flex w-48 flex-col">
                  <div className="mb-3 text-[10px] font-bold tracking-wide" style={{ color: ORANGE }}>QR VERIFICATION</div>
                  <div className="flex-1 rounded-xl p-3" style={{ backgroundColor: LIGHT_GRAY, border: `1px solid ${ORANGE}` }}>
                    <div className="flex justify-end">
                      <div className="rounded-lg border-2 border-gray-200 bg-white p-1" style={{ borderColor: ORANGE }}>
                        <QRCodeCanvas value={qrValue} size={60} fgColor={DARK} bgColor="#FFFFFF" level="M" />
                      </div>
                    </div>
                    <p className="mt-2 text-[8px] leading-relaxed" style={{ color: DARK }}>
                      Scan this QR code to verify the authenticity of this ID card. The QR contains the unique member identifier for verification purposes.
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[8px] font-semibold" style={{ color: ORANGE }}>
                      <FiCheckCircle size={10} /> Verified by {cardData.library.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[4px]" style={{ backgroundColor: ORANGE }} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Verification badge */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <FiShield size={12} /> ID Card is secured with QR verification
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #root > * { visibility: hidden; }
          [data-no-print] { display: none !important; }
          .card-container, .card-container * { visibility: visible; }
          .card-container { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
        }
      `}</style>
    </motion.div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div className="text-[8px] font-semibold tracking-wider" style={{ color: GRAY }}>{label}</div>
      <div className="text-[12px] font-bold truncate" style={{ color: DARK }}>{value}</div>
    </div>
  );
}

function DetailSmall({ label, value }) {
  return (
    <div>
      <div className="text-[7px] font-medium" style={{ color: GRAY }}>{label}</div>
      <div className="text-[9px] font-semibold truncate" style={{ color: DARK }}>{value}</div>
    </div>
  );
}
