<li class="dropdown pc-h-item">
    <a class="pc-head-link dropdown-toggle arrow-none me-0" data-pc-toggle="dropdown" href="#" role="button" aria-haspopup="false" aria-expanded="false">
        <i data-feather="bell"></i>
        @php
            // Hitung semua yang belum dibaca (tanpa batas waktu)
            $unreadCount = Auth::user()->appNotifications()
                ->where('is_read', false)
                ->count();
        @endphp
        @if($unreadCount > 0)
            <span class="badge bg-danger pc-h-badge animate-bounce">{{ $unreadCount }}</span>
        @endif
    </a>
    <div class="dropdown-menu dropdown-notification dropdown-menu-end pc-h-dropdown p-0 overflow-hidden shadow-2xl" style="width: 350px;">
        <div class="dropdown-header flex items-center justify-between py-4 px-5 bg-primary-500 rounded-t-lg">
            <h5 class="m-0 text-white">Notifications (Today)</h5>
            <form action="{{ route('notifications.read-all') }}" method="POST" class="m-0">
                @csrf
                <button type="submit" class="btn btn-sm btn-link text-white p-0 text-xs opacity-80 hover:opacity-100" style="text-decoration: none;">
                    <i data-feather="check-circle" class="inline-block me-1" style="width:12px; height:12px;"></i> Mark all read
                </button>
            </form>
        </div>
        <div class="dropdown-body py-1 overflow-y-auto overflow-x-hidden" style="max-height: 250px;">
            @php
                // Logika: Notif hilang HANYA JIKA (Sudah Dibaca DAN Lewat 1x24 Jam)
                // Berarti tampilkan jika: (Belum Dibaca) ATAU (Sudah Dibaca tapi < 24 Jam)
                $notifications = Auth::user()->appNotifications()
                    ->where(function($q) {
                        $q->where('is_read', false)
                          ->orWhere('created_at', '>=', \Carbon\Carbon::now()->subDay());
                    })
                    ->orderBy('created_at', 'desc')
                    ->get();
            @endphp

            @forelse($notifications as $notif)
                <div class="dropdown-item py-3 px-4 border-b border-gray-100 last:border-0 {{ !$notif->is_read ? 'bg-primary-50/20' : '' }} group">
                    <div class="flex items-center">
                        <div class="shrink-0">
                            <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center">
                                <i data-feather="{{ str_contains(strtolower($notif->title), 'absensi') ? 'file-text' : 'bell' }}" style="width: 18px; height: 18px;"></i>
                            </div>
                        </div>
                        <div class="grow ms-3 overflow-hidden">
                            <a href="{{ route('notifications.read', $notif->id) }}" class="block" style="text-decoration: none; color: inherit;">
                                <h6 class="mb-1 text-[13px] {{ !$notif->is_read ? 'font-bold' : 'text-muted' }} truncate">{{ $notif->title }}</h6>
                                <p class="mb-1 text-[12px] text-muted line-clamp-1 truncate">{{ $notif->message }}</p>
                                <span class="text-[10px] text-muted">{{ $notif->created_at->diffForHumans() }}</span>
                            </a>
                        </div>
                        <div class="shrink-0 ms-3 flex flex-col items-center justify-center" style="width: 25px;">
                            @if(!$notif->is_read)
                                <span class="w-2 h-2 rounded-full bg-primary-500 mb-2"></span>
                                <a href="{{ route('notifications.read', $notif->id) }}" class="btn btn-xs btn-light-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm" style="width: 24px; height: 24px; padding: 0; border-radius: 4px;" title="Tandai sudah dibaca">
                                    <i data-feather="check" style="width:14px; height:14px;"></i>
                                </a>
                            @else
                                <i data-feather="check-circle" class="text-success opacity-50" style="width:16px; height:16px;" title="Sudah dibaca"></i>
                            @endif
                        </div>
                    </div>
                </div>
            @empty
                <div class="py-12 text-center flex flex-col items-center justify-center">
                    <div class="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mb-3">
                        <i data-feather="coffee" class="text-gray-300" style="width: 32px; height: 32px;"></i>
                    </div>
                    <p class="text-muted text-sm m-0 fw-bold">No active notifications</p>
                    <p class="text-muted text-xs">Semua tugas telah selesai!</p>
                </div>
            @endforelse
        </div>
    </div>
</li>

@push('styles')
<style>
    .pc-h-badge {
        position: absolute;
        top: 10px;
        right: 5px;
        padding: 3px 5px;
        font-size: 9px;
        border-radius: 50%;
        line-height: 1;
        min-width: 16px;
    }
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
    }
    .animate-bounce {
        animation: bounce 2s infinite;
    }
</style>
@endpush

@push('modals')
<!-- Toast Container -->
<div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999;">
    @php
        $latestUnread = Auth::user()->appNotifications()->where('is_read', false)->orderBy('created_at', 'desc')->first();
    @endphp
    @if($latestUnread && !session('notification_toasted_' . $latestUnread->id))
        <div id="liveToast" class="toast show border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true" style="background: #fff; border-left: 4px solid #4680ff !important;">
            <div class="toast-header border-0 bg-transparent py-3">
                <div class="bg-primary-500 rounded p-1 me-2">
                    <i data-feather="bell" class="text-white" style="width: 16px; height: 16px;"></i>
                </div>
                <strong class="me-auto text-primary-500">{{ $latestUnread->title }}</strong>
                <small class="text-muted">{{ $latestUnread->created_at->diffForHumans() }}</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body py-3">
                <p class="mb-3 text-dark fw-600">{{ $latestUnread->message }}</p>
                <div class="flex gap-2">
                    <a href="{{ route('notifications.read', $latestUnread->id) }}" class="btn btn-primary btn-sm px-4">Buka Laporan</a>
                    <button type="button" class="btn btn-light btn-sm" data-bs-dismiss="toast">Nanti Saja</button>
                </div>
            </div>
        </div>
        @php session(['notification_toasted_' . $latestUnread->id => true]); @endphp
    @endif
</div>
@endpush

