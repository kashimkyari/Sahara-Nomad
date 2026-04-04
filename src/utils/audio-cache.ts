import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const AUDIO_CACHE_DIR = `${(FileSystem as any).cacheDirectory}audio_cache/`;

export const ensureCacheDir = async () => {
  const info = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_CACHE_DIR, { intermediates: true });
  }
};

export const getCachedAudioUri = async (remoteUri: string): Promise<string> => {
  if (!remoteUri) return remoteUri;
  
  try {
    await ensureCacheDir();
    
    // Hash URI to get a safe filename
    const filename = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      remoteUri
    );
    const localUri = `${AUDIO_CACHE_DIR}${filename}.m4a`;
    
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      return localUri;
    }
    
    // Download in background but return remote for immediate streaming if first time
    FileSystem.downloadAsync(remoteUri, localUri).catch(err => console.log('Audio Cache Error:', err));
    
    return remoteUri;
  } catch (error) {
    console.error('Audio Cache Proxy Error:', error);
    return remoteUri;
  }
};
