import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ExternalLink, Phone, Mail } from 'lucide-react';

const WHATSAPP_NUMBER = '918491943437';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const AdminSupport = () => {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        Customer Support — WhatsApp
                    </CardTitle>
                    <CardDescription>All customer support is handled through WhatsApp. Customers reach you via the floating WhatsApp button on every page and the contact page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 border rounded-lg space-y-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <MessageCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-lg">WhatsApp Business</h3>
                            <p className="text-sm text-muted-foreground">Primary contact channel. Customers message you directly on WhatsApp for order inquiries, product questions, and support.</p>
                            <p className="text-sm font-mono bg-muted px-3 py-1.5 rounded inline-block">+91 84919 43437</p>
                            <div className="flex gap-2 pt-2">
                                <Button asChild className="bg-green-600 hover:bg-green-700">
                                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Open WhatsApp
                                    </a>
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href={`https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        WhatsApp Web
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 border rounded-lg space-y-4">
                            <h3 className="font-semibold text-lg">How Customers Reach You</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2">
                                    <MessageCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span><strong>Floating WhatsApp button</strong> — visible on every page (bottom-right corner)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span><strong>Contact page</strong> — WhatsApp link + email + phone number</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Mail className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <span><strong>Footer</strong> — WhatsApp, email, and phone links</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSupport;
