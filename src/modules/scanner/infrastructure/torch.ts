export interface TorchCapabilities {
  torch?: boolean;
}

type TorchCapabilityTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities & TorchCapabilities;
};

interface TorchConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

export function supportsTorch(
  track: MediaStreamTrack | null | undefined,
): boolean {
  if (!track) {
    return false;
  }

  const capabilityTrack = track as TorchCapabilityTrack;

  if (typeof capabilityTrack.getCapabilities !== 'function') {
    return false;
  }

  try {
    const capabilities = capabilityTrack.getCapabilities() as MediaTrackCapabilities & TorchCapabilities;
    return capabilities.torch === true;
  } catch {
    return false;
  }
}

export async function setTorchEnabled(
  track: MediaStreamTrack | null | undefined,
  enabled: boolean,
): Promise<boolean> {
  if (!track || !supportsTorch(track)) {
    return false;
  }

  try {
    await track.applyConstraints({
      advanced: [{ torch: enabled } as TorchConstraintSet],
    });
    return true;
  } catch {
    return false;
  }
}
