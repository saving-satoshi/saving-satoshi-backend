-- Add the new progress_list column
ALTER TABLE accounts_progress
ADD COLUMN progress_list TEXT[];

-- List of challenge keys without difficulty levels
DO $$ 
DECLARE
    challenge_keys TEXT[] := ARRAY[
      'CH1INT1', 'CH1INT2', 'CH1GEN1', 'CH1GEN2', 'CH1GEN3', 'CH1GEN4', 'CH1TRA1', 'CH1TRA2', 'CH1TRA3', 'CH1OUT1', 'CH1OUT2',
      'CH2INT1', 'CH2INT2', 'CH2HSH1', 'CH2HSH2', 'CH2HSH3', 'CH2HSH4', 'CH2HSH5', 'CH2HSH6', 'CH2SCR1', 'CH2SCR2', 'CH2MIN1', 'CH2OUT1',
      'CH3INT1', 'CH3SOL1', 'CH3POL1', 'CH3POL2', 'CH3COO1', 'CH3COO2', 'CH3COO3', 'CH3SPL1', 'CH3SPL2', 'CH3OUT1',
      'CH4INT1', 'CH4PKY1', 'CH4PKY2', 'CH4PKY3', 'CH4PKY4', 'CH4ADR1', 'CH4ADR2', 'CH4ADR3', 'CH4OUT1',
      'CH5INT1', 'CH5INT2', 'CH5INT3', 'CH5DRM1', 'CH5DRM2', 'CH5DRM3', 'CH5DRM4', 'CH5DRM5', 'CH5DRM6', 'CH5DRM7', 'CH5VFS1', 'CH5VFS2', 'CH5VFS3', 'CH5VFS4', 'CH5VFS5', 'CH5VLS1', 'CH5VLS2', 'CH5VLS3', 'CH5VLS4', 'CH5OUT1',
      'CH6INT1', 'CH6INT2', 'CH6INO1', 'CH6INO2', 'CH6INO3', 'CH6INO4', 'CH6INO5', 'CH6PUT1', 'CH6PUT2', 'CH6PUT3', 'CH6PUT4', 'CH6PUT5', 'CH6PUT6', 'CH6OUT1',
      'CH7INT1', 'CH7INT2', 'CH7INT3', 'CH7MPT1', 'CH7OUT1',
      'CH8INT1', 'CH8INT2', 'CH8INT3', 'CH8BBK1', 'CH8BBK2', 'CH8BBK3', 'CH8BBK4', 'CH8BBK5', 'CH8BBK6', 'CH8BBK7', 'CH8BBK8', 'CH8OUT1'
    ];
    rec RECORD;
BEGIN
    -- Loop through each row in the accounts_progress table
    FOR rec IN (SELECT id, progress FROM accounts_progress) LOOP
        DECLARE
            idx INT;
            progress_array TEXT[];
        BEGIN
            idx := array_position(challenge_keys, rec.progress);

            -- If the index is found, populate the progress_list up to the current tip key
            IF idx IS NOT NULL THEN
                progress_array := array(
                    SELECT
                        CASE
                            WHEN key IN ('CH6INO4', 'CH6PUT1', 'CH6PUT2', 'CH6PUT3') THEN key || '_NORMAL'
                            ELSE key
                        END
                    FROM unnest(challenge_keys[1:idx]) key
                );

                -- Update the row with the new progress_list
                UPDATE accounts_progress
                SET progress_list = progress_array
                WHERE id = rec.id;
            END IF;
        END;
    END LOOP;
END $$;
