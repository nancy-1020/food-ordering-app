import { useState } from "react";
import ApiService from "../../services/ApiService";
import { useError } from "../common/ErrorDisplay";

const Payment = ({ amount, orderId, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const { ErrorDisplay, showError } = useError();

    const handlePayment = async () => {

        setLoading(true);

        try {

            const body = {
                amount: amount,
                orderId: orderId
            };

            const paymentResponse =
                await ApiService.proceedForPayment(body);

            if (paymentResponse.statusCode !== 200) {
                throw new Error(
                    paymentResponse.message || "Failed to initialize payment"
                );
            }

            const razorpayOrder =
                JSON.parse(paymentResponse.data);

            const options = {
                key: "rzp_test_SrzhiU7oyE8kSS",

                amount: razorpayOrder.amount,

                currency: razorpayOrder.currency,

                name: "Food App",

                description: "Food Order Payment",

                order_id: razorpayOrder.id,

                handler: async function (response) {

                    try {

                        await ApiService.updateOrderPayment({
                            orderId: orderId,
                            amount: amount,
                            transactionId:
                            response.razorpay_payment_id,
                            success: true
                        });

                        onSuccess(response);

                    } catch (err) {
                        showError(
                            "Payment succeeded but order update failed"
                        );
                    }
                },

                modal: {
                    ondismiss: async function () {

                        await ApiService.updateOrderPayment({
                            orderId: orderId,
                            amount: amount,
                            transactionId: "FAILED",
                            success: false,
                            failureReason: "Payment Cancelled"
                        });
                    }
                },

                prefill: {
                    name: "Customer"
                },

                theme: {
                    color: "#3399cc"
                }
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", async function (response) {

                await ApiService.updateOrderPayment({
                    orderId: orderId,
                    amount: amount,
                    transactionId:
                    response.error.metadata.payment_id,
                    success: false,
                    failureReason:
                    response.error.description
                });

                showError(response.error.description);
            });

            razorpay.open();

        } catch (error) {

            console.log("Payment Error:", error);

            showError(error.message);

        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="payment-container">

            <ErrorDisplay />

            <h2>Complete Payment</h2>

            <button
                onClick={handlePayment}
                disabled={loading}
                className="pay-button"
            >
                {loading
                    ? "Processing..."
                    : `Pay ₹${amount}`}
            </button>

        </div>
    );
};

export default Payment;