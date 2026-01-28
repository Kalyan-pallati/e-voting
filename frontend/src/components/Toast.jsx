export default function Toast({message}) {
    return (
        <div className="px-6 py-4 rounded-xl shadow-xl bg-blue-500 text-white text-base font-medium">
            {message}
        </div>
    )
}