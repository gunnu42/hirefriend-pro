-- KYC Verifications RLS Policies

-- Enable RLS on kyc_verifications if not already enabled
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own KYC verifications
CREATE POLICY "Users can read own kyc"
ON public.kyc_verifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own KYC verifications
CREATE POLICY "Users can insert own kyc"  
ON public.kyc_verifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own KYC verifications
CREATE POLICY "Users can update own kyc"
ON public.kyc_verifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage kyc"
ON public.kyc_verifications 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
