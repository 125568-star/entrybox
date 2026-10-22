# EntryBox

**Everything you need. We put it in a box.**

Blue, mobile-friendly starter-box storefront for Brisbane, with a Supabase-backed product catalogue.

## Current features

- New Flat, First Kitchen, Picnic, Bathroom, Student, and Build Your Own boxes
- 23 example products organised by category
- Add or remove items, adjust quantities and search products
- Enter custom item requests to be quoted separately
- Automatically updated illustrative price totals and review dialog
- Live read-only catalogue access to Supabase
- No payment processing or order submission yet

## Publish a preview using GitHub Pages

1. Open this repository's **Settings > Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose **main** and **/(root)**, then save.
4. GitHub will show the public preview address when deployment completes.

You do not need to buy a domain.

## Database

Supabase project ref: pulbcpjwxliwnmkiyfhe (formerly called Coordinator).

- Public read-only catalogue: products, boxes, box_items
- Future orders (not publicly accessible): orders, order_items, custom_item_requests

The website uses a publishable API key and never a secret/service_role key. RLS policies protect private order data.

**Remaining manual dashboard step:** Rename the project's display name from Coordinator to EntryBox, and rename the other existing Provider project to Zero Dollar Store. These label changes don't alter project references.

## Files

- index.html — page layout
- style.css — responsive blue styling
- app.js — Supabase catalogue and customiser

## Before launching a real shop

Replace example prices, confirm supplier and delivery costs, implement server-side checkout and orders, add administration and security controls, and test all purchase flows.
