-- Policy: same YouTube channel may be registered by different users;
-- same user cannot register the same channel twice.
-- Drop global unique on channel_id if present; enforce (user_id, channel_id).

ALTER TABLE public.user_channels
  DROP CONSTRAINT IF EXISTS user_channels_channel_id_key;

ALTER TABLE public.user_channels
  DROP CONSTRAINT IF EXISTS user_channels_channel_id_unique;

DROP INDEX IF EXISTS public.user_channels_channel_id_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS user_channels_user_id_channel_id_uidx
  ON public.user_channels (user_id, channel_id);
