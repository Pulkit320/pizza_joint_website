-- ============================================================
-- Migration:    V005__create_order_reviews.sql
-- Description:  Creates order_reviews and order_item_ratings tables to track customer feedback.
-- Affected:     order_reviews, order_item_ratings
-- Rollback:     DROP TABLE IF EXISTS order_item_ratings CASCADE; DROP TABLE IF EXISTS order_reviews CASCADE;
-- Author:       Database Agent
-- Version:      1.1.0
-- ============================================================

CREATE TABLE IF NOT EXISTS order_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    overall_score SMALLINT NOT NULL CHECK (overall_score >= 1 AND overall_score <= 5),
    food_quality_score SMALLINT NOT NULL CHECK (food_quality_score >= 1 AND food_quality_score <= 5),
    speed_score SMALLINT NOT NULL CHECK (speed_score >= 1 AND speed_score <= 5),
    written_comment VARCHAR(500),
    would_order_again BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT uq_order_review UNIQUE (order_id, customer_id)
);

COMMENT ON TABLE order_reviews IS 'Customer reviews for completed orders, capturing overall experience and scores';
COMMENT ON COLUMN order_reviews.id IS 'Primary key, unique identifier of the review';
COMMENT ON COLUMN order_reviews.order_id IS 'Foreign key referencing the associated order';
COMMENT ON COLUMN order_reviews.customer_id IS 'Foreign key referencing the customer who placed the order and wrote the review';
COMMENT ON COLUMN order_reviews.overall_score IS 'Customer rating of overall experience, from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN order_reviews.food_quality_score IS 'Customer rating of food quality, from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN order_reviews.speed_score IS 'Customer rating of order speed/delivery, from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN order_reviews.written_comment IS 'Optional free-text feedback from the customer, up to 500 characters';
COMMENT ON COLUMN order_reviews.would_order_again IS 'Boolean indicating if the customer would order from this establishment again';
COMMENT ON COLUMN order_reviews.created_at IS 'Timestamp when the review was created';

CREATE TABLE IF NOT EXISTS order_item_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES order_reviews(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    item_score SMALLINT NOT NULL CHECK (item_score >= 1 AND item_score <= 5)
);

COMMENT ON TABLE order_item_ratings IS 'Granular ratings for specific items within a reviewed order';
COMMENT ON COLUMN order_item_ratings.id IS 'Primary key, unique identifier of the order item rating';
COMMENT ON COLUMN order_item_ratings.review_id IS 'Foreign key referencing the parent order review';
COMMENT ON COLUMN order_item_ratings.order_item_id IS 'Foreign key referencing the specific order item being rated';
COMMENT ON COLUMN order_item_ratings.product_id IS 'Foreign key referencing the product, cached here for query efficiency';
COMMENT ON COLUMN order_item_ratings.item_score IS 'Customer rating for the specific item, from 1 (poor) to 5 (excellent)';
