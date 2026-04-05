import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import API from '../constants/api';

const AUDIO_CACHE_DIR_PATH = `${Paths.cache.uri}/audio_cache/`;
const API_ORIGIN = API.API_URL.replace(/\/api\/v1\/?$/, '');

export const ensureCacheDir = async () => {
  const dir = new Directory(AUDIO_CACHE_DIR_PATH);
  if (!dir.exists) {
    dir.create();
  }
};

export const normalizeAudioUri = (uri: string): string => {
  if (!uri) return uri;
  if (/^(https?:|file:|content:|asset:)/i.test(uri)) return uri;
  if (uri.startsWith('/')) return `${API_ORIGIN}${uri}`;
  return `${API_ORIGIN}/${uri}`;
};

const getAudioExtension = (uri: string): string => {
  try {
    const pathname = uri.split('?')[0].split('#')[0];
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : 'm4a';
  } catch {
    return 'm4a';
  }
};

export const getCachedAudioUri = async (remoteUri: string): Promise<string> => {
  if (!remoteUri) return remoteUri;
  
  try {
    await ensureCacheDir();
    const normalizedUri = normalizeAudioUri(remoteUri);
    const extension = getAudioExtension(normalizedUri);
    
    // Hash URI to get a safe filename
    const filename = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      normalizedUri
    );
    const localUri = `${AUDIO_CACHE_DIR_PATH}${filename}.${extension}`;
    
    const file = new File(localUri);
    if (file.exists) {
      return localUri;
    }
    
    await File.downloadFileAsync(normalizedUri, new File(localUri));
    return localUri;
  } catch (error) {
    console.error('Audio Cache Proxy Error:', error);
    return normalizeAudioUri(remoteUri);
  }
};
