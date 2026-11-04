import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type BarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onScan: (isbn: string) => void;
};

export function BarcodeScannerModal({
  visible,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [supported, setSupported] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') {
      return;
    }

    let active = true;
    let timer: number | null = null;

    async function startCamera() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setSupported(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setScanning(true);

        const DetectorClass = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
        if (DetectorClass) {
          const detector = new DetectorClass({
            formats: ['ean_13', 'ean_8', 'upc_a', 'code_128'],
          });

          const detectFrame = async () => {
            if (!active || !videoRef.current) return;
            try {
              if (videoRef.current.readyState >= 2) {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  const cleaned = barcodes[0].rawValue.replace(/[^0-9X]/gi, '');
                  if (cleaned.length >= 10) {
                    onScan(cleaned);
                    onClose();
                    return;
                  }
                }
              }
            } catch {
              // Frame dropped, continue next tick.
            }
            if (active) {
              timer = window.setTimeout(detectFrame, 250);
            }
          };
          detectFrame();
        }
      } catch {
        setSupported(false);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setScanning(false);
    };
  }, [visible, onScan, onClose]);

  const handleManualInputFallback = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const DetectorClass = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
    if (DetectorClass && typeof createImageBitmap !== 'undefined') {
      createImageBitmap(file).then(async (bitmap) => {
        try {
          const detector = new DetectorClass({
            formats: ['ean_13', 'ean_8', 'upc_a', 'code_128'],
          });
          const barcodes = await detector.detect(bitmap);
          if (barcodes?.[0]?.rawValue) {
            const cleaned = barcodes[0].rawValue.replace(/[^0-9X]/gi, '');
            if (cleaned.length >= 10) {
              onScan(cleaned);
              onClose();
            }
          }
        } catch {
          // Keep manual entry available.
        }
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="barcode-outline" size={20} color={theme.colors.accent} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Scan book barcode</Text>
              <Text style={styles.hint}>
                Hold the back cover facing the camera to read the ISBN.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close scanner"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={theme.colors.faint} />
            </Pressable>
          </View>

          <View style={styles.scannerViewport}>
            {Platform.OS === 'web' && supported ? (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 12,
                }}
              />
            ) : (
              <View style={styles.unsupportedArea}>
                <Ionicons name="camera-outline" size={40} color={theme.colors.faint} />
                <Text style={styles.unsupportedText}>
                  Camera scanner ready via photo upload below.
                </Text>
              </View>
            )}

            <View style={styles.reticle}>
              <View style={styles.reticleBorder} />
            </View>
          </View>

          <View style={styles.footer}>
            {Platform.OS === 'web' && (
              <label style={webFileInputLabelStyle}>
                <Ionicons name="image-outline" size={16} color={theme.colors.accent} />
                <span style={webFileInputSpanStyle}>Pick photo of barcode</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleManualInputFallback}
                  style={{ display: 'none' }}
                />
              </label>
            )}

            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Enter ISBN by hand</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const webFileInputLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 16px',
  borderRadius: 10,
  border: `1px solid ${theme.colors.border}`,
  backgroundColor: theme.colors.card,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  color: theme.colors.text,
  marginBottom: 10,
};

const webFileInputSpanStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: theme.colors.text,
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  scannerViewport: {
    height: 240,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unsupportedArea: {
    alignItems: 'center',
    padding: 20,
  },
  unsupportedText: {
    color: theme.colors.faint,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  reticle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  reticleBorder: {
    width: 220,
    height: 120,
    borderWidth: 2,
    borderColor: theme.colors.card,
    borderRadius: 8,
    borderStyle: 'dashed',
    opacity: 0.85,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
