CREATE POLICY "Users can delete own transactions"
ON public.transactions
FOR DELETE
USING (auth.uid() = user_id);