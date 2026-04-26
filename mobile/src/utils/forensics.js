import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

const LOG_FILE = `${FileSystem.documentDirectory}forensics.log`;

/**
 * Records a step to a persistent file.
 * If the app crashes, this file remains on disk.
 */
export const recordStep = async (stepName) => {
  try {
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} - ${stepName}\n`;
    
    // Read existing log or create new
    let existingLog = '';
    const info = await FileSystem.getInfoAsync(LOG_FILE);
    if (info.exists) {
      existingLog = await FileSystem.readAsStringAsync(LOG_FILE);
    }
    
    await FileSystem.writeAsStringAsync(LOG_FILE, existingLog + entry);
    console.log(`[FORENSICS] Recorded: ${stepName}`);
  } catch (error) {
    console.error('[FORENSICS] Failed to record step:', error);
  }
};

/**
 * Checks for a leftover log file on startup.
 */
export const checkLastStep = async () => {
  try {
    const info = await FileSystem.getInfoAsync(LOG_FILE);
    if (info.exists) {
      const content = await FileSystem.readAsStringAsync(LOG_FILE);
      const lines = content.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      
      Alert.alert(
        '🚨 CRASH FORENSICS',
        `The app exited during the last session.\n\nRECORDED STEPS:\n${content}\n\nLAST SUCCESSFUL STEP:\n${lastLine}`,
        [{ text: 'Clear Log & Continue', onPress: () => FileSystem.deleteAsync(LOG_FILE) }]
      );
    }
  } catch (error) {
    console.error('[FORENSICS] Failed to check last step:', error);
  }
};

/**
 * Utility to slow down execution so we can see what's happening.
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
