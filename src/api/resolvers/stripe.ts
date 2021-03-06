const stripe = require('stripe')(process.env.STRIPE_CLIENT_SECRET);

import { ResolverContext } from '@typeDefs/resolver';

import { COURSE } from '../../../content/course-keys';
import { BUNDLE } from '../../../content/course-keys';
import storefront from '../../../content/course-storefront';

export default {
  Mutation: {
    // https://stripe.com/docs/payments/checkout/one-time#create-one-time-payments
    stripeCreateOrder: async (
      parent: any,
      {
        imageUrl,
        courseId,
        bundleId,
        coupon,
      }: {
        imageUrl: string;
        courseId: COURSE;
        bundleId: BUNDLE;
        coupon: string;
      },
      { me }: ResolverContext
    ) => {
      const course = storefront[courseId];
      const bundle = course.bundles[bundleId];

      // TODO apply discount if coupon

      let session;

      try {
        session = await stripe.checkout.sessions.create({
          customer_email: me.email,
          client_reference_id: me.uid,
          payment_method_types: ['card'],
          line_items: [
            {
              name: course.header,
              description: bundle.header,
              images: [imageUrl],
              amount: bundle.price,
              currency: 'usd',
              quantity: 1,
            },
          ],
          metadata: {
            courseId,
            bundleId,
          },
          payment_intent_data: {
            description: `${courseId} ${bundleId}`,
          },
          success_url: process.env.BASE_URL,
          cancel_url: `${process.env.BASE_URL}/checkout?courseId=${courseId}&bundleId=${bundleId}&imageUrl=${imageUrl}`,
        });
      } catch (error) {
        throw new Error(error);
      }

      return { id: session.id };
    },
  },
};
