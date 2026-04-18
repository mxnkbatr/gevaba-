import { Metadata, ResolvingMetadata } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/database/db';
import MonkProfileClient from './MonkProfileClient';

export function generateStaticParams() {
  return [
    { locale: 'en', id: 'initial' },
    { locale: 'mn', id: 'initial' },
  ];
}

type Props = {
    params: Promise<{ id: string; locale: string }>
};

function SkeletonLoader() {
    return (
        <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)] animate-pulse">
            <div className="w-full h-40 bg-stone/20 rounded-2xl mb-4"></div>
            <div className="w-2/3 h-8 bg-stone/20 rounded-xl mb-4"></div>
            <div className="w-full h-20 bg-stone/20 rounded-2xl"></div>
        </div>
    );
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id, locale } = await params;
    const validLocale = (['mn', 'en'].includes(locale) ? locale : 'mn') as 'mn' | 'en';

    if (id === 'initial') {
        return {
            title: 'Loading...',
            description: 'Loading profile...'
        }
    }

    let product;
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        product = await fetch(`${baseUrl}/api/monks/${id}`, { next: { revalidate: 3600 } }).then((res) => res.json());
    } catch (e) {
        console.error("Metadata fetch error", e);
        return {
            title: 'Gevabal - Monk Profile',
            description: 'Book a consultation with a Buddhist Monk.'
        }
    }

    if (!product) {
        return {
            title: 'Monk Not Found',
        }
    }

    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `${product.name?.[validLocale]} - Buddhist Monk & Spiritual Guide`,
        description: product.bio?.[validLocale]?.substring(0, 160) || "Spiritual guidance and consultation.",
        openGraph: {
            images: [product.image, ...previousImages],
            locale: validLocale,
            alternateLocale: validLocale === 'mn' ? 'en_US' : 'mn_MN',
        },
        alternates: {
            canonical: `https://gevabal.mn/${validLocale}/monks/${id}`,
            languages: {
                'en': `https://gevabal.mn/en/monks/${id}`,
                'mn': `https://gevabal.mn/mn/monks/${id}`,
            },
        },
    };
}

export default async function MonkPage({ params }: Props) {
    const resolvedParams = await params;
    if (resolvedParams.id === 'initial') {
        return <SkeletonLoader />;
    }

    let initialMonk: Record<string, unknown> | null = null;
    const initialServices: unknown[] = [];
    const initialReviews = {
        reviews: [] as unknown[],
        stats: { averageRating: 0, totalReviews: 0 },
    };

    try {
        const { db } = await connectToDatabase();
        const id = resolvedParams.id;

        let query: { $or: Record<string, unknown>[] } = {
            $or: [{ clerkId: id }, { _id: id }],
        };
        if (ObjectId.isValid(id)) {
            query.$or.push({ _id: new ObjectId(id) });
        }

        const reviewQuery = ObjectId.isValid(id)
            ? { monkId: new ObjectId(id) }
            : { monkId: id };

        const [monkDoc, servicesDoc, reviewsDoc] = await Promise.all([
            db.collection('users').findOne({ $and: [query, { role: 'monk' }] }),
            db.collection('services').find({}).toArray(),
            db.collection('reviews').find(reviewQuery).toArray(),
        ]);

        if (monkDoc) {
            initialMonk = { ...monkDoc, _id: monkDoc._id.toString() } as Record<string, unknown>;
        }

        for (const s of servicesDoc) {
            const doc = s as { _id: ObjectId };
            initialServices.push({ ...s, _id: doc._id.toString() });
        }

        const ratings = (reviewsDoc as { rating?: number }[])
            .map((r) => r.rating)
            .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));
        initialReviews.reviews = (reviewsDoc as { _id: ObjectId }[]).map((r) => ({
            ...r,
            _id: r._id.toString(),
        }));
        initialReviews.stats = {
            totalReviews: ratings.length,
            averageRating:
                ratings.length > 0
                    ? Number(
                        (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1),
                    )
                    : 0,
        };
    } catch (e) {
        console.error('Server prefetch error:', e);
    }

    return (
        <MonkProfileClient
            initialMonk={initialMonk}
            initialServices={initialServices}
            initialReviews={initialReviews}
        />
    );
}
