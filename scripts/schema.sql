create extension if not exists moddatetime schema extensions;

-- Create table for sellers
CREATE TABLE public.sellers
(
    id           SERIAL PRIMARY KEY,
    first_name   VARCHAR(50)                            NOT NULL,
    last_name    VARCHAR(50)                            NOT NULL,
    phone_number VARCHAR(10)                            NOT NULL CHECK (phone_number ~ '^(0[1-9])([0-9]{8})$'
        ), -- Validate French phone number
    _deleted     BOOLEAN                  DEFAULT FALSE NOT NULL,
    _modified    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for buyers
CREATE TABLE public.buyers
(
    id           SERIAL PRIMARY KEY,
    first_name   VARCHAR(50)                            NOT NULL,
    last_name    VARCHAR(50)                            NOT NULL,
    phone_number VARCHAR(10)                            NOT NULL CHECK (phone_number ~ '^(0[1-9])([0-9]{8})$'
        ), -- Validate French phone number
    _deleted     BOOLEAN                  DEFAULT FALSE NOT NULL,
    _modified    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for articles
CREATE TABLE public.articles
(
    id                SERIAL PRIMARY KEY,
    seller_id         INT                                    NOT NULL REFERENCES public.sellers (id) ON DELETE SET NULL,
    price             NUMERIC(10, 2)                         NOT NULL CHECK (price >= 0),               -- Ensure price is non-negative
    short_description TEXT                                   NOT NULL,
    brand             VARCHAR(50),
    model             VARCHAR(50),
    type              VARCHAR(50)                            NOT NULL,                                  -- E.g., 'clothes', 'ski shoes', 'snowboard boots'
    size              VARCHAR(20),
    color             VARCHAR(30),
    created_at        TIMESTAMP                DEFAULT NOW(),
    _deleted          BOOLEAN                  DEFAULT FALSE NOT NULL,
    _modified         TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- Inline purchase-related columns
    buyer_id          INT                                    REFERENCES public.buyers (id) ON DELETE SET NULL, -- Link buyer to the article
    purchase_date     TIMESTAMP
);

-- Automatically update the _modified column on the sellers table
CREATE TRIGGER update_sellers_modified
    BEFORE UPDATE
    ON public.sellers
    FOR EACH ROW EXECUTE FUNCTION moddatetime('_modified');

-- Automatically update the _modified column on the buyers table
CREATE TRIGGER update_buyers_modified
    BEFORE UPDATE
    ON public.buyers
    FOR EACH ROW EXECUTE FUNCTION moddatetime('_modified');

-- Automatically update the _modified column on the articles table
CREATE TRIGGER update_articles_modified
    BEFORE UPDATE
    ON public.articles
    FOR EACH ROW EXECUTE FUNCTION moddatetime('_modified');

ALTER TABLE public.sellers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;

-- add a table to the publication so we can subscribe to changes
alter publication supabase_realtime add table public.sellers;
alter publication supabase_realtime add table public.buyers;
alter publication supabase_realtime add table public.articles;
