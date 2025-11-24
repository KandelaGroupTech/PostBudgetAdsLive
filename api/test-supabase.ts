import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    try {
        console.log('Testing Supabase connection...');
        console.log('SUPABASE_URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
        console.log('Has SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        console.log('SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
        console.log('SERVICE_ROLE_KEY starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10));

        const supabase = createClient(
            process.env.SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );

        // Try to query the ads table
        const { data, error } = await supabase
            .from('ads')
            .select('count')
            .limit(1);

        if (error) {
            console.error('Supabase error:', error);
            return response.status(500).json({
                success: false,
                error: error.message,
                details: error
            });
        }

        return response.status(200).json({
            success: true,
            message: 'Supabase connection successful!',
            data: data
        });
    } catch (error: any) {
        console.error('Test failed:', error);
        return response.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}
