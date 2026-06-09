-- Close RLS gaps on platform hook tables (advisor: rls_enabled_no_policy)

DROP POLICY IF EXISTS household_invites_member ON household_invites;
CREATE POLICY household_invites_member ON household_invites FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS household_invites_create ON household_invites;
CREATE POLICY household_invites_create ON household_invites FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS household_invites_delete ON household_invites;
CREATE POLICY household_invites_delete ON household_invites FOR DELETE
  USING (
    auth.uid() = created_by
    OR household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS cook_together_sessions_member ON cook_together_sessions;
CREATE POLICY cook_together_sessions_member ON cook_together_sessions FOR ALL
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()))
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
