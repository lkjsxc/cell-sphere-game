#!/usr/bin/env node
/** Exact progression boundary, persistence, hashing, debit/credit, and round-trip audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { addProgressionIntegers, compareProgressionIntegers, formatProgressionEngineering,
  multiplyProgressionIntegers, normalizeProgressionInteger, parseProgressionInteger,
  parseProgressionIntegerRuntime, progressionIntegerMagnitude, subtractProgressionIntegers } from '../../src/core/progression-integer.js';
import { defaultMeta, validateMeta } from '../../src/platform/storage.js';
import { MEMORY_NODES, purchaseEvolutionLevel } from '../../src/game/skills/index.js';
import { defaultAgentSave, validateAgentSave } from '../../src/agent/schema.js';

const safe='9007199254740991',unsafe='9007199254740992',huge=`9${'8'.repeat(2047)}`,credit='123456789012345678901234567890';
const arithmetic={safePlusOne:addProgressionIntegers(safe,'1'),hugePlusCredit:addProgressionIntegers(huge,credit),
 hugeTimesThree:multiplyProgressionIntegers(huge,'3'),debitRoundTrip:addProgressionIntegers(subtractProgressionIntegers(huge,credit),credit)};
const canonical={leadingZero:normalizeProgressionInteger('00042','7'),negative:normalizeProgressionInteger('-1','7'),scientific:normalizeProgressionInteger('1e9','7'),
 unsafeNumber:normalizeProgressionInteger(Number(unsafe),'7'),tooLong:normalizeProgressionInteger(`1${'0'.repeat(4096)}`,'7')};
const meta=validateMeta({...defaultMeta(),echoBalance:huge,totalEchoes:huge,bestScore:huge,legacyBestScore:huge,runs:unsafe,worldSeedIndex:credit,
 highestEnvironmentLevel:huge,revision:unsafe});
const serialized=JSON.stringify(meta),roundTrip=validateMeta(JSON.parse(serialized));
const root=MEMORY_NODES.find((node)=>node.kind==='root');
const purchase=purchaseEvolutionLevel(meta,root.id,{expectedLevel:'0',expectedRevision:unsafe,transactionKey:'number-audit'});
const agentBase=defaultAgentSave(17),agent={...agentBase,meta:{...agentBase.meta,...meta}};
const agentRoundTrip=validateAgentSave(JSON.parse(JSON.stringify(agent)));
const digest=(value)=>createHash('sha256').update(value).digest('hex');
const report={schema:1,boundaries:{safe,unsafe,comparison:compareProgressionIntegers(unsafe,safe),parsedType:typeof parseProgressionInteger(unsafe),runtimeType:typeof parseProgressionIntegerRuntime(unsafe),magnitude:progressionIntegerMagnitude(huge),formatted:formatProgressionEngineering(huge,6)},
 arithmetic:{...arithmetic,exact:arithmetic.safePlusOne===unsafe&&arithmetic.debitRoundTrip===huge},canonical,
 persistence:{schema:meta.schema,jsonContainsRawBigInt:false,serializedBytes:Buffer.byteLength(serialized),stable:JSON.stringify(roundTrip)===serialized,
   digest:digest(serialized),digestStable:digest(JSON.stringify(roundTrip))===digest(serialized),agentStable:agentRoundTrip.meta.echoBalance===huge},
 transaction:{ok:purchase.ok,cost:purchase.spent,balance:purchase.meta.echoBalance,exactDebit:purchase.ok&&addProgressionIntegers(purchase.meta.echoBalance,purchase.spent)===huge,
   staleRejected:purchaseEvolutionLevel(purchase.meta,root.id,{expectedLevel:'0',expectedRevision:unsafe,transactionKey:'stale-number-audit'}).reason},valid:false};
report.valid=report.arithmetic.exact&&report.boundaries.runtimeType==='bigint'&&canonical.leadingZero==='7'&&canonical.negative==='7'&&canonical.scientific==='7'&&canonical.unsafeNumber==='7'&&canonical.tooLong==='7'
 &&report.persistence.stable&&report.persistence.digestStable&&report.persistence.agentStable&&report.transaction.ok&&report.transaction.exactDebit&&report.transaction.staleRejected==='stale-level';
mkdirSync('reports',{recursive:true});writeFileSync('reports/progression-number-audit.json',`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;
