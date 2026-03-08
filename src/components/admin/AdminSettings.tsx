import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExchangeRates, useRefreshExchangeRates } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { RefreshCw, Loader2, DollarSign, CheckCircle, AlertCircle, Store, Globe } from 'lucide-react';

const AdminSettings = () => {
    const { toast } = useToast();
    const { data: exchangeRates = [], isLoading } = useExchangeRates();
    const refreshRates = useRefreshExchangeRates();

    const latestRate = exchangeRates[0];
    const inrRate = latestRate?.rates?.INR;

    const handleRefreshRates = async () => {
        try {
            const result = await refreshRates.mutateAsync();
            toast({
                title: 'Exchange Rates Updated',
                description: `New INR rate: ₹${result.rates?.INR?.toFixed(2) || 'N/A'} per USD`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to refresh rates',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Store Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Store Information
                    </CardTitle>
                    <CardDescription>Basic store settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Store Name</p>
                            <p className="font-medium">Abu Hurayrah Essentials</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">abuhurayrahessentials@gmail.com</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">+91 84919 43437</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">Kashmir, India</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Exchange Rates */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Exchange Rates
                    </CardTitle>
                    <CardDescription>Currency conversion settings for INR/USD support</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* API Status */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${latestRate ? 'bg-green-100' : 'bg-amber-100'}`}>
                                {latestRate ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium">Exchange Rate API</p>
                                <p className="text-sm text-muted-foreground">
                                    {latestRate ? 'Connected and working' : 'No rates cached - click refresh'}
                                </p>
                            </div>
                        </div>
                        <Badge variant={latestRate ? 'default' : 'secondary'}>
                            {latestRate ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>

                    {/* Current Rates */}
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <DollarSign className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">USD → INR</p>
                                        <p className="text-sm text-muted-foreground">
                                            {latestRate?.fetched_at
                                                ? `Last updated: ${format(new Date(latestRate.fetched_at), 'MMM d, yyyy h:mm a')}`
                                                : 'Never updated'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">
                                        ₹{inrRate?.toFixed(2) || '—'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">per $1 USD</p>
                                </div>
                            </div>

                            <Button onClick={handleRefreshRates} disabled={refreshRates.isPending} className="w-full">
                                {refreshRates.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Fetching Latest Rates...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh Exchange Rates
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                Rates are fetched from a free Currency API (no API key needed). Click the button above to get the latest rates.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
};

export default AdminSettings;
