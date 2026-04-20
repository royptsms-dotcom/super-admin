@extends('layouts.app')

@section('title', 'Manajemen Izin Akses')

@section('content')
<div class="page-header">
    <div class="page-block">
        <div class="row align-items-center">
            <div class="col-md-12">
                <div class="page-header-title">
                    <h5 class="m-b-10">Permission Management</h5>
                </div>
                <ul class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Home</a></li>
                    <li class="breadcrumb-item">Permission</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-sm-12">
        <div class="card">
            <div class="card-header">
                <h5>Atur Izin Akses Berdasarkan Job</h5>
            </div>
            <div class="card-body">
                @if(session('success'))
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        {{ session('success') }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                @endif

                <form action="{{ route('admin.permissions.store') }}" method="POST">
                    @csrf
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <label class="form-label font-bold">Pilih Job <span class="text-danger">*</span></label>
                            <select name="job" id="job-selector" class="form-select" required>
                                <option value="" disabled selected>-- Pilih Job --</option>
                                @foreach($jobs as $job)
                                    <option value="{{ $job }}">{{ $job }}</option>
                                @endforeach
                            </select>
                            <small class="text-muted">Izin akses akan diterapkan untuk semua user dengan job ini.</small>
                        </div>
                    </div>

                    <div id="permissions-container" style="display: none;">
                        <hr>
                        <h6 class="mb-3 mt-4 text-primary"><i data-feather="shield" class="me-2 text-primary" style="width: 18px;"></i> Daftar Fitur & Izin Akses</h6>
                        
                        <div class="permission-grid">
                            @foreach($permissionsList as $category => $features)
                                <div class="permission-card">
                                    <div class="p-4 border rounded bg-white dark:bg-themedark-cardbg shadow-sm h-100 transition-all hover:shadow-md">
                                        <div class="flex items-center justify-between border-b pb-3 mb-4">
                                            <h6 class="font-bold tracking-wide uppercase text-[12px] text-primary flex items-center gap-2 m-0">
                                                @if($category == 'UTAMA') <i data-feather="grid"></i>
                                                @elseif($category == 'SHARE LOKASI & LAPORAN') <i data-feather="map"></i>
                                                @elseif($category == 'APLIKASI MOBILE (E-SMS)') <i data-feather="smartphone"></i>
                                                @elseif($category == 'KONTROL SERTIFIKAT') <i data-feather="award"></i>
                                                @elseif($category == 'ABSENSI') <i data-feather="calendar"></i>
                                                @endif
                                                {{ $category }}
                                            </h6>
                                            <div class="form-check form-switch m-0">
                                                <input class="form-check-input select-all-category" type="checkbox" title="Pilih Semua di Kategori Ini">
                                            </div>
                                        </div>
                                        <div class="space-y-3">
                                            @foreach($features as $route => $data)
                                                <div class="form-check form-switch mb-2 py-1">
                                                    <input class="form-check-input permission-checkbox {{ isset($data['is_parent']) && $data['is_parent'] ? 'parent-switch' : 'child-switch' }}" 
                                                           type="checkbox" 
                                                           name="permissions[]" 
                                                           value="{{ $route }}" 
                                                           id="perm-{{ str_replace('.', '-', $route) }}"
                                                           @if(isset($data['parent'])) data-parent="perm-{{ str_replace('.', '-', $data['parent']) }}" @endif>
                                                    <label class="form-check-label fw-600 text-dark dark:text-white" for="perm-{{ str_replace('.', '-', $route) }}" style="font-size: 13px; cursor: pointer;">
                                                        {{ $data['label'] }}
                                                    </label>
                                                </div>
                                            @endforeach
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>

                        <style>
                            .permission-grid {
                                display: grid;
                                grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                                gap: 20px;
                            }
                            .permission-card {
                                display: flex;
                                flex-direction: column;
                            }
                            .transition-all { transition: all 0.3s ease; }
                            .hover\:shadow-md:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; }
                        </style>

                        <div class="mt-5 border-t pt-4 text-end">
                            <button type="submit" class="btn btn-primary px-5 py-2 fw-bold shadow-lg d-inline-flex align-items-center gap-2" style="border-radius: 8px;">
                                <i data-feather="save"></i> SIMPAN SEMUA PERMISSION
                            </button>
                        </div>
                    </div>

                    <div id="select-job-placeholder" class="text-center py-5">
                        <i data-feather="user-check" class="text-muted mb-3" style="width: 48px; height: 48px;"></i>
                        <h6 class="text-muted">Silakan pilih job terlebih dahulu untuk mengatur izin akses.</h6>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    $(document).ready(function() {
        // Function to check child status based on parent
        function updateChildStatus() {
            $('.child-switch').each(function() {
                const parentId = $(this).data('parent');
                if (parentId) {
                    const isParentChecked = $('#' + parentId).is(':checked');
                    const $container = $(this).closest('.form-check');
                    
                    if (!isParentChecked) {
                        $(this).addClass('opacity-50');
                        $container.addClass('text-muted');
                        $(this).css('pointer-events', 'none');
                    } else {
                        $(this).removeClass('opacity-50');
                        $container.removeClass('text-muted');
                        $(this).css('pointer-events', 'auto');
                    }
                }
            });
        }

        $('#job-selector').on('change', function() {
            const job = $(this).val();
            if (!job) return;

            $('#select-job-placeholder').hide();
            $('#permissions-container').fadeIn();

            // Reset all checkboxes first
            $('.permission-checkbox').prop('checked', false);

            // Fetch existing permissions via AJAX
            $.get(`{{ url('admin/permissions') }}/${job}`, function(data) {
                if (data.permissions && data.permissions.length > 0) {
                    data.permissions.forEach(route => {
                        $(`.permission-checkbox[value="${route}"]`).prop('checked', true);
                    });
                }
                updateChildStatus();
            });
        });

        // Handle select all for category
        $(document).on('change', '.select-all-category', function() {
            const isChecked = $(this).is(':checked');
            $(this).closest('.permission-card').find('.permission-checkbox').prop('checked', isChecked);
            updateChildStatus();
        });

        // Handle parent switch change
        $(document).on('change', '.parent-switch', function() {
            updateChildStatus();
        });
    });
</script>
@endpush
