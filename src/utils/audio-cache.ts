import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const AUDIO_CACHE_DIR_PATH = `${Paths.cache.uri}/audio_cache/`;

export const ensureCacheDir = async () => {
  const dir = new Directory(AUDIO_CACHE_DIR_PATH);
  if (!dir.exists) {
    dir.create();
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
    const localUri = `${AUDIO_CACHE_DIR_PATH}${filename}.m4a`;
    
    const file = new File(localUri);
    if (file.exists) {
      return localUri;
    }
    
    // Download in background but return remote for immediate streaming if first time
    // In new API, download is handled via File.downloadFileAsync
    File.downloadFileAsync(remoteUri, new File(localUri)).catch((err: any) => console.log('Audio Cache Error:', err));
    
    return remoteUri;
  } catch (error) {
    console.error('Audio Cache Proxy Error:', error);
    return remoteUri;
  }
};
