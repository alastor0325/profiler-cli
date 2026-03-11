import * as fs from 'fs';
import * as zlib from 'zlib';

export interface ProfileData {
  threads: any[];
  shared: { stringArray: string[] };
}

export function parseProfileFile(filePath: string): ProfileData {
  const gzipData = fs.readFileSync(filePath);
  const jsonData = zlib.gunzipSync(gzipData);
  return JSON.parse(jsonData.toString());
}

export function getInlineFramesAtStack(
  profile: ProfileData,
  threadIndex: number,
  stackIdx: number
): Array<{frameIdx: number, funcIdx: number, depth: number, funcName: string}> {
  const thread = profile.threads[threadIndex];
  const { stackTable, frameTable, funcTable } = thread;
  const strings = profile.shared.stringArray;

  const allFrames: Array<{frameIdx: number, funcIdx: number, depth: number, funcName: string, address: number, stackDepth: number}> = [];
  const seenFuncNames = new Set<string>();
  let currentStackIdx: number | null = stackIdx;
  let stackDepth = 0;

  while (currentStackIdx !== null && currentStackIdx !== undefined) {
    const frameIdx = stackTable.frame[currentStackIdx];
    if (frameIdx !== null && frameIdx !== undefined) {
      const address = frameTable.address[frameIdx];

      if (address !== null && address !== undefined && address !== -1) {
        const framesAtAddress: Array<{depth: number, funcIdx: number, frameIdx: number, funcName: string}> = [];
        for (let i = 0; i < frameTable.length; i++) {
          if (frameTable.address[i] === address) {
            const depth = frameTable.inlineDepth ? (frameTable.inlineDepth[i] || 0) : 0;
            const funcIdx = frameTable.func[i];
            const funcNameIdx = funcTable.name[funcIdx];
            const funcName = strings[funcNameIdx];

            const baseName = funcName.replace(/^(Ion|Baseline|Interpreter):\s*/, '');
            if (!seenFuncNames.has(baseName)) {
              framesAtAddress.push({ depth, funcIdx, frameIdx: i, funcName });
            }
          }
        }

        framesAtAddress.sort((a, b) => b.depth - a.depth);
        for (const frame of framesAtAddress) {
          const baseName = frame.funcName.replace(/^(Ion|Baseline|Interpreter):\s*/, '');
          allFrames.push({
            frameIdx: frame.frameIdx,
            funcIdx: frame.funcIdx,
            depth: frame.depth,
            funcName: frame.funcName,
            address,
            stackDepth
          });
          seenFuncNames.add(baseName);
        }
      } else {
        const funcIdx = frameTable.func[frameIdx];
        const funcNameIdx = funcTable.name[funcIdx];
        const funcName = strings[funcNameIdx];
        const baseName = funcName.replace(/^(Ion|Baseline|Interpreter):\s*/, '');

        if (!seenFuncNames.has(baseName)) {
          allFrames.push({
            frameIdx,
            funcIdx,
            depth: 0,
            funcName,
            address: -1,
            stackDepth
          });
          seenFuncNames.add(baseName);
        }
      }
    }
    currentStackIdx = stackTable.prefix[currentStackIdx];
    stackDepth++;
  }

  return allFrames.reverse();
}

export function getStackWithInlineFrames(
  profile: ProfileData,
  threadIndex: number,
  stackIdx: number
): string[] {
  const frames = getInlineFramesAtStack(profile, threadIndex, stackIdx);
  const seenFuncs = new Set<number>();
  const result: string[] = [];

  for (const frame of frames) {
    if (!seenFuncs.has(frame.funcIdx)) {
      result.push(frame.funcName);
      seenFuncs.add(frame.funcIdx);
    }
  }

  return result;
}
