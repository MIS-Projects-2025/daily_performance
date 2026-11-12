-- Sample data copied from dp.xlsx (7 and 8 Nov 2026, WW701). Optional.
-- Assumes cal_workweek 701 exists in analog_calendar; change if your WW numbering differs.

INSERT INTO dp_daily (entry_date,cal_workweek,line_code,capacity,wip,commit_qty,capacity_remarks,outs,gap_analysis) VALUES ('2026-11-07',701,'F1',5360000,9410238,3970258,'720K open capacity*',3843811,NULL);
INSERT INTO dp_daily (entry_date,cal_workweek,line_code,capacity,wip,commit_qty,capacity_remarks,outs,gap_analysis) VALUES ('2026-11-07',701,'F2',4290000,7197168,3422121,'600K Open Capacity*
100K Hold Due to no available carriertape
100K TSOT open capacity',2937325,NULL);
INSERT INTO dp_daily (entry_date,cal_workweek,line_code,capacity,wip,commit_qty,capacity_remarks,outs,gap_analysis) VALUES ('2026-11-07',701,'F3',3928000,7568721,2808181,'1machine allocated for EmGA capacity 45k
1machine allocated for OLGA capacity 45k
1machine allocated for BGA/QFP Ilan commit with multiple set up
2x3- no wip for 39hsi
2machines allocated for detape lots
240k- EMGA capacity constraint
1.6m capapcity constraint for QFN.DFN',2698672,'320K capacity loss on 12 machines : encountered 5 hrs DT due to depleted primary-list  carrier tape, caused machine stoppages while secondary materials awaited
VTRX042 - 10 hrs DT due to Vacuum problem/Pick and Place/TRR problem
AT2680060 - 11 hrs DT due to Handler Hang up/Software error/Singulator problem


VTRX052 - 6 hrs DT due to Prolonged mc set up/ conversion from 24Lto 20L and mark teaching
HSI400I014 - 5 hrs DT due to Pick and place/taper and sorter problem
 (cap loss: 120K)');
INSERT INTO dp_daily (entry_date,cal_workweek,line_code,capacity,wip,commit_qty,capacity_remarks,outs,gap_analysis) VALUES ('2026-11-08',701,'F1',5280000,8521636,3734695,'1.6Mu open capacity',3871163,NULL);
INSERT INTO dp_daily (entry_date,cal_workweek,line_code,capacity,wip,commit_qty,capacity_remarks,outs,gap_analysis) VALUES ('2026-11-08',701,'F2',4610000,7731577,3583960,'700K open capacity',3123863,'LGA/LQFP Top Machines Contributor: 03VITROX, 06VITROX, 51VITROX : 32hrs/128K Impact
701K left at Pipeline.
Total of 331K timing issue affected by the machine related issues also affects on No splitting restriction.');
INSERT INTO dp_daily (entry_date,cal_workweek,line_code,capacity,wip,commit_qty,capacity_remarks,outs,gap_analysis) VALUES ('2026-11-08',701,'F3',4023000,6828267,3286296,'3 machines under PM (2 at28, 1 hsi)
RW- low WIP
1 machine for set up to 208mils tray input 45k capacity from 7x7 QDN
229k TSOC- capacity constraint
21.7k 240mils capapcity constraint
26k MSOP- not doable to ship until cut-off
387k Rn- capacity constraint',2644824,NULL);

INSERT INTO dp_action (daily_id,action_text,owner,when_text,due_date,due_ww,status,status_note,sort_order) SELECT id,'Complete approval of remaining secondary materials and release approved alternatives for production use.','Realyn','WW702',NULL,702,'Ongoing','5 item codes approved',0 FROM dp_daily WHERE entry_date='2026-11-07' AND line_code='F3';
INSERT INTO dp_action (daily_id,action_text,owner,when_text,due_date,due_ww,status,status_note,sort_order) SELECT id,'VTRX042: adjust vacuum pressure and purge on time, TTM adjust placing position. AT2680060: clean singulator vacuum, adjust singulator stopper air flow, full shutdown, fix LAN cable and reconnect handler PC. VTRX052: tenured tech support for conversion. HSI400I014: teach pick-up position at tape, encoder teach, adjust taper blow time.','EE Technician','2026-11-08','2026-11-08',NULL,'Done','Machines are running',1 FROM dp_daily WHERE entry_date='2026-11-07' AND line_code='F3';
INSERT INTO dp_action (daily_id,action_text,owner,when_text,due_date,due_ww,status,status_note,sort_order) SELECT id,'Monitor recurring limping errors and rejection trends through daily equipment performance reviews.','Marlon / Vic','2026-11-08','2026-11-08',NULL,'Sustain',NULL,2 FROM dp_daily WHERE entry_date='2026-11-08' AND line_code='F2';
INSERT INTO dp_action (daily_id,action_text,owner,when_text,due_date,due_ww,status,status_note,sort_order) SELECT id,'Assign TnR operators certified on FVI to perform 100% inspection to reduce pipeline WIP.','Marlon / Vic','2026-11-08','2026-11-08',NULL,'Sustain',NULL,3 FROM dp_daily WHERE entry_date='2026-11-08' AND line_code='F2';
